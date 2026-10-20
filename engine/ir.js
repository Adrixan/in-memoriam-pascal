/*
 * Based on https://raw.github.com/zaach/floop.js/master/lib/lljsgen.js @ 4a981a2799
 */

"use strict";

function id(identifier) {
  return identifier.split('-').join('_').replace('?', '$');
}

function isNode() {
  return typeof process === 'object' && typeof require === 'function';
}

function SymbolTable() {
  var data = [{}],
    name_cnt = 0;

  function begin_scope() {
    data.push({});
  }
  function end_scope() {
    if (data.length === 1) {
      throw new Error("end_scope without begin_scope");
    }
    data.pop();
  }

  function indexOf(name) {
    for (var idx = data.length - 1; idx >= 0; idx--) {
      if (data[idx][name]) {
        return idx;
      }
    }
    return undefined;
  }

  function lookup(name) {
    var name = name.toUpperCase(),
      idx = indexOf(name);
    if (typeof (idx) !== "undefined") {
      return data[idx][name];
    }
    throw new Error("Name '" + name + "' not found in symbol table");
  }

  function insert(name, value, level) {
    if (typeof level === 'undefined') { level = data.length - 1; }
    data[level][name.toUpperCase()] = value;
  }

  // insert a definition for unit procedure/function
  function unit_pinsert(name, evalfn, fparams, rettype) {
    var kind = rettype ? 'func' : 'proc',
      decl = {
        node: kind + '_decl', name: name, evalfn: evalfn, level: 0,
        type: rettype, lparams: [], fparams: []
      };
    for (var i = 0; i < fparams.length; i++) {
      var fparam = fparams[i];
      fparam.node = 'param';
      fparam.id = "param" + i;
      decl.fparams.push(fparam);
    }
    insert(name, decl);
  }

  // like lookup, but returns undefined for unknown names
  function find(name) {
    var key = name.toUpperCase(),
      idx = indexOf(key);
    return (typeof idx !== "undefined") ? data[idx][key] : undefined;
  }

  function replace(name, value) {
    var name = name.toUpperCase(),
      idx = indexOf(name);
    if (typeof (idx) !== "undefined") {
      data[idx][name] = value;
    } else {
      throw new Error("Name '" + name + "' not found to replace");
    }
  }

  function new_name(name) {
    return name + "_" + (name_cnt++) + "_";
  }

  function display(all) {
    console.warn("-------------");
    for (var idx = 0; idx < data.length; idx++) {
      console.warn("--- " + idx + " ---");
      for (var name in data[idx]) {
        if (all || !data[idx][name].evalfn) {
          console.warn(name + ": ", data[idx][name]);
        }
      }
    }
    console.warn("-------------");
  }

  return {
    lookup: lookup,
    find: find,
    insert: insert,
    unit_pinsert: unit_pinsert,
    replace: replace,
    begin_scope: begin_scope,
    end_scope: end_scope,
    new_name: new_name,
    display: display
  };
};

function IR(theAST) {

  var st = new SymbolTable(),
    str_cnt = 0,
    default_units = ['SYSTEM'];

  // Store global settings in the symbol table
  st.insert('_settings_', {});

  var cur_line = 0,              // source line of the statement being translated
    extra_decls = [],            // helper functions and types emitted once
    defined_helpers = {},        // names of helpers already in extra_decls
    llnames = {},                // LLVM struct names already handed out
    pending_types = {},          // record types declared later in the same block
    type_counter = 0,
    unit_names = (theAST && theAST.unit_names) || {};

  // Runtime error codes understood by the engine host (see host.js)
  var TRAP = { DIVZERO: 200, RANGE: 201, NILPTR: 204, INPUT: 106, EXHAUSTED: 100, FILE: 2 };

  // Emit an IR helper (function or type definition) once per program
  function define_helper(name, lines) {
    if (!defined_helpers[name]) {
      defined_helpers[name] = true;
      extra_decls.push.apply(extra_decls, lines);
    }
  }

  // Unique LLVM struct name for a record type
  function new_llname(base) {
    var name = '%rec_' + String(base).replace(/[^A-Za-z0-9_]/g, '_'),
      n = 0, candidate = name;
    while (llnames[candidate]) { candidate = name + '_' + (++n); }
    llnames[candidate] = true;
    return candidate;
  }

  // Append code that aborts the program with a runtime error
  function emit_trap(ir, code) {
    define_helper('trap_decl', ['declare void @_pascal_trap(i32, i32) noreturn']);
    ir.push('  call void @_pascal_trap(i32 ' + code + ', i32 ' + cur_line + ')');
    ir.push('  unreachable');
  }

  // Branch to a runtime error when cond (an i1 register) is true
  function emit_check(ir, cond, code) {
    var base = st.new_name('chk'),
      bad = base + '_bad',
      ok = base + '_ok';
    ir.push('  br i1 ' + cond + ', label %' + bad + ', label %' + ok);
    ir.push(bad + ':');
    emit_trap(ir, code);
    ir.push(ok + ':');
  }

  // Units are CommonJS modules provided by the engine bundle (see
  // engine/host.js); each exports a constructor named after the unit.
  function load_unit(unit) {
    var unit_path = './units/' + unit.toLowerCase() + ".js",
      unit_name = unit.toUpperCase(),
      rlib;
    try {
      rlib = require(unit_path);
    } catch (e) {
      if (unit_name === 'CRT') {
        throw new Error("The Crt unit (screen control) is not available in the browser");
      }
      throw new Error("Unit '" + unit + "' not found");
    }
    return new rlib[unit_name](st);
  }

  function copy_type(obj) {
    var copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
  }

  function expand_type(type) {
    var t = copy_type(type);
    while (t.name === 'NAMED') {
      var tdecl = st.lookup(t.id);
      t = tdecl.type;
    }
    return t;
  }

  // Resolve a type definition to add lltype containing LLVM type
  // string. If the type is a named type then it will be resolved to
  // a base type first.
  function normalize_type(type) {
    var t = expand_type(type), // implicit copy
      lltype, vdef = "0",
      name = (typeof t.origname !== 'undefined') ? t.origname : t.name;
    switch (name) {
      case 'REAL': lltype = "float"; vdef = "0.0"; break;

      // structured datatypes
      case 'STRING':
        if (typeof t.type === 'undefined') {
          t.type = { node: 'type', name: 'CHARACTER' };
        }
        t.type = normalize_type(t.type);
        lltype = "i8*";
        // unassigned strings read as the empty string
        define_helper('emptystr', ['@.emptystr = private constant [1 x i8] zeroinitializer']);
        vdef = "getelementptr inbounds ([1 x i8]* @.emptystr, i32 0, i32 0)";
        break;
      case 'ARRAY':
        var start, end, vdefs, ttype;
        t.index = normalize_type(t.index);
        t.type = normalize_type(t.type);
        start = t.index.start;
        end = t.index.end;
        vdefs = [];
        ttype = t.type;
        lltype = '[' + (end - start + 1) + ' x ' + ttype.lltype + ']';
        for (var i = 0; i < end - start + 1; i++) {
          vdefs.push(ttype.lltype + ' ' + ttype.default_value);
        }
        vdef = '[' + vdefs.join(', ') + ']';
        break;
      case 'RECORD':
        // Records are named LLVM structs so that they can refer to themselves
        // through pointers. Fixed fields come first; the variant part is one
        // trailing word array big enough for the largest variant, accessed by
        // casting its address to the struct of the selected variant.
        if (typeof t.field_map !== 'undefined' && typeof t.lltype !== 'undefined') {
          break;
        }
        var comps = [],
          sections = t.sections.slice();
        t.field_map = {};
        t.component_map = {};
        if (typeof t.llname === 'undefined') {
          t.llname = new_llname('anon' + (type_counter++));
        }
        if (t.variant && t.variant.tag) {
          sections.push({ node: 'component', id: t.variant.tag, type: t.variant.tagtype });
        }
        for (var i = 0; i < sections.length; i++) {
          var comp = sections[i];
          comp.type = normalize_type(comp.type);
          if (typeof t.field_map[comp.id] !== 'undefined') {
            throw new Error("Duplicate field '" + comp.id + "' in record");
          }
          comps.push(comp.type.lltype);
          t.field_map[comp.id] = { index: i, type: comp.type, variant: -1 };
          t.component_map[comp.id] = i;
        }
        if (t.variant) {
          var maxWords = 1, variants = t.variant.variants;
          t.variant_structs = [];
          for (var v = 0; v < variants.length; v++) {
            var vcomps = [], bytes = 0, vsections = variants[v].sections;
            var vname = t.llname + '_v' + v;
            for (var k = 0; k < vsections.length; k++) {
              var vcomp = vsections[k];
              vcomp.type = normalize_type(vcomp.type);
              if (typeof t.field_map[vcomp.id] !== 'undefined') {
                throw new Error("Duplicate field '" + vcomp.id + "' in record");
              }
              vcomps.push(vcomp.type.lltype);
              bytes += upper_size(vcomp.type);
              t.field_map[vcomp.id] = { index: k, type: vcomp.type, variant: v };
            }
            extra_decls.push(vname + ' = type { ' + (vcomps.length ? vcomps.join(', ') : 'i32') + ' }');
            t.variant_structs.push(vname);
            maxWords = Math.max(maxWords, Math.ceil(bytes / 4));
          }
          t.payload_index = comps.length;
          t.payload_type = '[' + maxWords + ' x i32]';
          comps.push(t.payload_type);
        }
        lltype = t.llname;
        vdef = 'zeroinitializer';
        extra_decls.push(t.llname + ' = type { ' + comps.join(', ') + ' }');
        break;

      case 'POINTER':
        var target = t.target, lltarget;
        if (target.name === 'NAMED') {
          var tdecl2 = st.find(target.id);
          if (tdecl2 && tdecl2.type) {
            lltarget = normalize_type(tdecl2.type).lltype;
          } else if (pending_types[target.id.toUpperCase()]) {
            // record declared further down in the same type section
            lltarget = pending_types[target.id.toUpperCase()];
          } else {
            throw new Error("Unknown type '" + target.id + "'");
          }
        } else {
          lltarget = normalize_type(target).lltype;
        }
        lltype = lltarget + '*';
        vdef = 'null';
        break;

      case 'SET':
        var base = t.base ? normalize_type(t.base) : null,
          low = base ? base.start : 0, high = base ? base.end : 255;
        if (typeof low !== 'number' || typeof high !== 'number') {
          throw new Error("Set base type must be an ordinal type");
        }
        if (low < 0 || high > 255) {
          throw new Error("Set elements must be in the range 0..255 (got " + low + ".." + high + ")");
        }
        t.base = base;
        t.low = low;
        t.high = high;
        lltype = '[32 x i8]';
        vdef = 'zeroinitializer';
        break;

      case 'TEXT':
        // Text file: { name, file handle }, see units/system.js
        lltype = '%TEXT';
        vdef = 'zeroinitializer';
        break;

      // INTEGER types
      case 'INTEGER':
        if (typeof t.origname === 'undefined') {
          t.origname = 'INTEGER';
        }
        lltype = "i32";
        vdef = 0;
        start = -32768;
        end = 32767;
        break;
      case 'BYTE':
        t.name = 'INTEGER';
        t.origname = 'BYTE';
        lltype = "i8";
        vdef = 0;
        start = 0;
        end = 255;
        break;
      case 'CHARACTER':
        t.name = 'INTEGER';
        t.origname = 'CHARACTER';
        lltype = "i8";
        vdef = 0;
        start = 0;
        end = 255;
        break;
      case 'SUBRANGE':
        if (typeof t.origname !== 'undefined') {
          break;
        }
        t.name = 'INTEGER';
        vdef = 0;

        var start = t.start,
          end = t.end,
          stype1, stype2;
        if (start.stype === 'variable') {
          var decl1 = st.lookup(t.start.val),
            type1 = normalize_type(decl1.type);
          stype1 = type1.name;
          start = type1.default_value;

          if (type1.origname === 'ENUMERATION') {
            t.origname = type1.origname;
            t.ids = type1.ids;
          } else if (typeof type1.origname !== 'undefined') {
            t.origname = type1.origname;
          } else {
            t.origname = stype1;
          }
          t.lltype = type1.lltype;
        } else {
          stype1 = start.stype;
          start = start.val;
          t.origname = stype1;

          switch (stype1) {
            case 'BOOLEAN': t.lltype = 'i1'; break;
            case 'BYTE': t.lltype = 'i8'; break;
            case 'CHARACTER': t.lltype = 'i8'; break;
            case 'INTEGER': t.lltype = 'i32'; break;
            default: throw new Error("Unknown SUBRANGE type: " + stype1);
          }
        }

        if (end.stype === 'variable') {
          var decl2 = st.lookup(t.end.val),
            type2 = normalize_type(decl2.type);
          stype2 = type2.name;
          end = type2.default_value;
        } else {
          stype2 = end.stype;
          end = end.val;
        }
        if (stype1 !== stype2) {
          throw new Error("Subrange of different types: " + stype1 + ' & ' + stype2);
        }
        if (typeof start !== 'number' || typeof end !== 'number') {
          throw new Error("TODO: support more complex constants in subrange definitions");
        }
        t.start = start;
        t.end = end;
        break;
      case 'BOOLEAN':
        t.origname = 'BOOLEAN';
        t.ids = ['FALSE', 'TRUE'];
        lltype = 'i1';
      // fall through since BOOLEAN is an enumeration type
      case 'ENUMERATION':
        t.name = 'INTEGER';
        vdef = 0;

        // Enums/bools are really just INTEGER with additional metadata
        if (typeof t.enum_type === 'undefined') {
          var tdecl = st.lookup(t.ids[0]);
          t.enum_type = tdecl.type.enum_type;
          t.enum_var = tdecl.type.enum_var;
          if (typeof t.origname === 'undefined') {
            t.origname = tdecl.type.origname;
          }
        } else if (typeof t.origname === 'undefined') {
          t.origname = t.name;
        }

        var ecnt = t.ids.length;
        if (typeof lltype === 'undefined') {
          lltype = "i8";
        }
        t.start = 0;
        t.end = ecnt - 1;
        break;
      default: throw new Error("TODO: handle " + t.name + " type");
    }
    if ((name === 'INTEGER' || name === 'BYTE' || name === 'CHARACTER') && typeof t.start === 'undefined') {
      t.start = start;
      t.end = end;
    }
    if (typeof t.lltype === 'undefined') {
      // don't stomp alternate INTEGER lltypes
      t.lltype = lltype;
    }
    if (typeof t.default_value === 'undefined') {
      t.default_value = vdef;
    }
    return t;
  }

  // Conservative upper bound (bytes) of the storage a value of this type needs;
  // every field is assumed to be padded to a 4 byte boundary.
  function upper_size(type) {
    var t = expand_type(type);
    switch (t.name === 'INTEGER' && t.origname ? t.origname : t.name) {
      case 'ARRAY':
        var n = t.index.end - t.index.start + 1;
        return Math.max(n, 1) * upper_size(t.type);
      case 'RECORD':
        var total = 0, key;
        for (key in t.field_map) {
          if (t.field_map[key].variant < 0) { total += upper_size(t.field_map[key].type); }
        }
        if (t.variant) { total += 4 * 64; }
        return Math.max(total, 4);
      case 'SET': return 32;
      case 'TEXT': return 8;
      default: return 4;
    }
  }

  // Human readable type name for error messages
  function describe_type(type) {
    var t = type || {};
    if (t.origname === 'CHARACTER') { return 'Char'; }
    if (t.origname === 'BOOLEAN') { return 'Boolean'; }
    if (t.origname === 'ENUMERATION') { return 'enumeration'; }
    if (t.origname === 'BYTE') { return 'Byte'; }
    switch (t.name) {
      case 'INTEGER': return 'Integer';
      case 'REAL': return 'Real';
      case 'STRING': return 'String';
      case 'POINTER': return 'pointer';
      case 'SET': return 'set';
      case 'RECORD': return 'record';
      case 'ARRAY': return 'array';
      case 'TEXT': return 'Text';
      case 'NILTYPE': return 'nil';
      default: return String(t.name || 'value');
    }
  }

  function isPointer(type) { return expand_type(type).name === 'POINTER'; }
  function isSet(type) { return expand_type(type).name === 'SET'; }
  function isRecord(type) { return expand_type(type).name === 'RECORD'; }

  function isScalar(type) {
    var t = expand_type(type);
    var res = false;
    // BOOLEAN, BYTE, CHARACTER, etc are all name INTEGER with an
    // origname subtype
    switch (t.name) {
      case 'INTEGER': res = true; break;
      case 'REAL': res = true; break;
    }
    return res;
  }

  function isString(type) {
    var t = expand_type(type);
    return (t.name === 'STRING');
  }

  function isScalarOrString(type) {
    return (isScalar(type) || isString(type));
  }

  function deref_name(lvalue) {
    var id = null,
      lv = lvalue,
      cnames = "";
    do {
      if (lv.node === 'expr_record_deref') {
        cnames = "." + lv.component + cnames;
      } else if (lv.node === 'expr_array_deref') {
        cnames = "_sub" + cnames;
      } else {
        cnames = lv.id + cnames;
      }
      lv = lv.lvalue;
    } while (lv);
    return cnames;
  }

  // Extend an integer-like value (i1/i8/i32, signed or unsigned char) to i32
  function to_i32(ir, node) {
    var reg;
    if (node.itype === 'i32') {
      return node.ilocal;
    }
    if (node.itype === 'i8' || node.itype === 'i1') {
      reg = '%' + st.new_name('ext');
      ir.push('  ' + reg + ' = zext ' + node.itype + ' ' + node.ilocal + ' to i32');
      return reg;
    }
    throw new Error("Value of type " + node.type.name + " is not an ordinal value");
  }

  // Register holding the value of a string or character expression as a
  // NUL-terminated i8* that is never null
  function to_cstr(ir, node) {
    var reg, tmp, ptr;
    if (node.type.name === 'STRING') {
      if (node.itype[0] === '[') {
        reg = '%' + st.new_name('cstr');
        ir.push('  ' + reg + ' = bitcast ' + node.itype + ' ' + node.ilocal + ' to i8*');
        return reg;
      }
      reg = '%' + st.new_name('cstr');
      ir.push('  ' + reg + ' = call i8* @_pascal_str(i8* ' + node.ilocal + ')');
      return reg;
    }
    if (node.type.origname === 'CHARACTER') {
      tmp = '%' + st.new_name('chrbuf');
      ptr = '%' + st.new_name('chrptr');
      ir.push('  ' + tmp + ' = alloca [2 x i8]');
      ir.push('  ' + ptr + ' = getelementptr inbounds [2 x i8]* ' + tmp + ', i32 0, i32 0');
      ir.push('  store i8 ' + node.ilocal + ', i8* ' + ptr);
      var end = '%' + st.new_name('chrend');
      ir.push('  ' + end + ' = getelementptr inbounds [2 x i8]* ' + tmp + ', i32 0, i32 1');
      ir.push('  store i8 0, i8* ' + end);
      return ptr;
    }
    throw new Error("Expected a string or character value");
  }

  // Set helpers: sets are 32 byte bitmaps indexed by ordinal value
  function set_helpers() {
    define_helper('trap_decl', ['declare void @_pascal_trap(i32, i32) noreturn']);
    define_helper('set_helpers', [
      'define void @_pascal_set_add([32 x i8]* %s, i32 %v, i32 %line) {',
      'entry:',
      '  %bad = icmp ugt i32 %v, 255',
      '  br i1 %bad, label %trap, label %ok',
      'trap:',
      '  call void @_pascal_trap(i32 201, i32 %line)',
      '  unreachable',
      'ok:',
      '  %byte = lshr i32 %v, 3',
      '  %p = getelementptr inbounds [32 x i8]* %s, i32 0, i32 %byte',
      '  %old = load i8* %p',
      '  %bit = and i32 %v, 7',
      '  %bit8 = trunc i32 %bit to i8',
      '  %mask = shl i8 1, %bit8',
      '  %new = or i8 %old, %mask',
      '  store i8 %new, i8* %p',
      '  ret void',
      '}',
      'define void @_pascal_set_remove([32 x i8]* %s, i32 %v, i32 %line) {',
      'entry:',
      '  %bad = icmp ugt i32 %v, 255',
      '  br i1 %bad, label %trap, label %ok',
      'trap:',
      '  call void @_pascal_trap(i32 201, i32 %line)',
      '  unreachable',
      'ok:',
      '  %byte = lshr i32 %v, 3',
      '  %p = getelementptr inbounds [32 x i8]* %s, i32 0, i32 %byte',
      '  %old = load i8* %p',
      '  %bit = and i32 %v, 7',
      '  %bit8 = trunc i32 %bit to i8',
      '  %mask = shl i8 1, %bit8',
      '  %inv = xor i8 %mask, -1',
      '  %new = and i8 %old, %inv',
      '  store i8 %new, i8* %p',
      '  ret void',
      '}',
      'define i1 @_pascal_set_has([32 x i8]* %s, i32 %v) {',
      'entry:',
      '  %bad = icmp ugt i32 %v, 255',
      '  br i1 %bad, label %no, label %ok',
      'no:',
      '  ret i1 0',
      'ok:',
      '  %byte = lshr i32 %v, 3',
      '  %p = getelementptr inbounds [32 x i8]* %s, i32 0, i32 %byte',
      '  %b = load i8* %p',
      '  %bit = and i32 %v, 7',
      '  %bit8 = trunc i32 %bit to i8',
      '  %sh = lshr i8 %b, %bit8',
      '  %low = and i8 %sh, 1',
      '  %r = icmp ne i8 %low, 0',
      '  ret i1 %r',
      '}',
      'define void @_pascal_set_range([32 x i8]* %s, i32 %lo, i32 %hi, i32 %line) {',
      'entry:',
      '  %i = alloca i32',
      '  store i32 %lo, i32* %i',
      '  br label %cond',
      'cond:',
      '  %cur = load i32* %i',
      '  %more = icmp sle i32 %cur, %hi',
      '  br i1 %more, label %body, label %done',
      'body:',
      '  call void @_pascal_set_add([32 x i8]* %s, i32 %cur, i32 %line)',
      '  %next = add i32 %cur, 1',
      '  store i32 %next, i32* %i',
      '  br label %cond',
      'done:',
      '  ret void',
      '}',
      // dst = a OP b, byte by byte; op: 0 union, 1 intersection, 2 difference
      'define void @_pascal_set_op([32 x i8]* %dst, [32 x i8]* %a, [32 x i8]* %b, i32 %op) {',
      'entry:',
      '  %i = alloca i32',
      '  store i32 0, i32* %i',
      '  br label %cond',
      'cond:',
      '  %cur = load i32* %i',
      '  %more = icmp slt i32 %cur, 32',
      '  br i1 %more, label %body, label %done',
      'body:',
      '  %pa = getelementptr inbounds [32 x i8]* %a, i32 0, i32 %cur',
      '  %pb = getelementptr inbounds [32 x i8]* %b, i32 0, i32 %cur',
      '  %pd = getelementptr inbounds [32 x i8]* %dst, i32 0, i32 %cur',
      '  %va = load i8* %pa',
      '  %vb = load i8* %pb',
      '  %isu = icmp eq i32 %op, 0',
      '  %isi = icmp eq i32 %op, 1',
      '  %u = or i8 %va, %vb',
      '  %n = and i8 %va, %vb',
      '  %nb = xor i8 %vb, -1',
      '  %d = and i8 %va, %nb',
      '  %r1 = select i1 %isi, i8 %n, i8 %d',
      '  %r = select i1 %isu, i8 %u, i8 %r1',
      '  store i8 %r, i8* %pd',
      '  %next = add i32 %cur, 1',
      '  store i32 %next, i32* %i',
      '  br label %cond',
      'done:',
      '  ret void',
      '}',
      // compare: mode 0 equal, 1 a is subset of b
      'define i1 @_pascal_set_cmp([32 x i8]* %a, [32 x i8]* %b, i32 %mode) {',
      'entry:',
      '  %i = alloca i32',
      '  store i32 0, i32* %i',
      '  br label %cond',
      'cond:',
      '  %cur = load i32* %i',
      '  %more = icmp slt i32 %cur, 32',
      '  br i1 %more, label %body, label %yes',
      'body:',
      '  %pa = getelementptr inbounds [32 x i8]* %a, i32 0, i32 %cur',
      '  %pb = getelementptr inbounds [32 x i8]* %b, i32 0, i32 %cur',
      '  %va = load i8* %pa',
      '  %vb = load i8* %pb',
      '  %iseq = icmp eq i32 %mode, 0',
      '  %nb = xor i8 %vb, -1',
      '  %sub = and i8 %va, %nb',
      '  %x = xor i8 %va, %vb',
      '  %diff = select i1 %iseq, i8 %x, i8 %sub',
      '  %bad = icmp ne i8 %diff, 0',
      '  %next = add i32 %cur, 1',
      '  store i32 %next, i32* %i',
      '  br i1 %bad, label %no, label %cond',
      'no:',
      '  ret i1 0',
      'yes:',
      '  ret i1 1',
      '}']);
  }

  // Evaluate a loaded set value into addressable storage; returns the pointer
  // register of a [32 x i8] holding the value of an already translated set
  // expression node.
  function set_address(ir, node) {
    var tmp;
    if (node.istack && node.itype === '[32 x i8]') {
      return node.istack;
    }
    tmp = '%' + st.new_name('settmp');
    ir.push('  ' + tmp + ' = alloca [32 x i8]');
    ir.push('  store [32 x i8] ' + node.ilocal + ', [32 x i8]* ' + tmp);
    return tmp;
  }

  // Deep copy of plain AST data (used to duplicate lvalues for WITH)
  function clone_ast(node) {
    return JSON.parse(JSON.stringify(node));
  }

  // Rewrite identifiers naming fields of the WITH record into record accesses
  function resolve_with(node, fields, record_lvalue) {
    var key, child, i;
    if (Array.isArray(node)) {
      for (i = 0; i < node.length; i++) {
        node[i] = resolve_with(node[i], fields, record_lvalue);
      }
      return node;
    }
    if (node === null || typeof node !== 'object') {
      return node;
    }
    if (node.node === 'variable' && Object.prototype.hasOwnProperty.call(fields, node.id)) {
      return { node: 'expr_record_deref', lvalue: clone_ast(record_lvalue), component: node.id, lineno: node.lineno };
    }
    for (key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key) && key !== 'type') {
        child = node[key];
        if (child !== null && typeof child === 'object') {
          node[key] = resolve_with(child, fields, record_lvalue);
        }
      }
    }
    return node;
  }

  function allocate_variable(ir, node, id, fname, type, defval) {
    var pdecl = st.lookup(fname),
      level = pdecl.level,
      vtype = copy_type(type),
      vdef = typeof defval !== 'undefined' ? defval : vtype.default_value;
    vtype.default_value = vdef;

    if (level === 0) {
      // global scope
      var sname = "@" + st.new_name(id);
      ir.push([sname + ' = private global ' + vtype.lltype + ' ' + vdef]);
    } else {
      // sub-program scope
      var sname = "%" + st.new_name(id + "_stack");
      ir.push('  ' + sname + ' = alloca ' + vtype.lltype);
      ir.push('  store ' + vtype.lltype + ' ' + vdef + ', ' + vtype.lltype + '* ' + sname);
    }

    st.insert(id, { node: node, type: vtype, sname: sname, level: pdecl.level });
    return sname;
  }

  function allocate_enums(ir, ids, fname, type, lltype) {
    var ecnt = ids.length,
      vlist = [];
    type.enum_type = '[' + ecnt + ' x i8*]';
    type.enum_var = '@' + st.new_name(type.name);
    type.origname = type.name;
    type.name = 'INTEGER';
    type.lltype = lltype;

    // Declare each ID
    for (var i = 0; i < ecnt; i++) {
      var eid = ids[i],
        elen = eid.length + 1,
        eidstr = st.new_name(type.enum_var + '.' + eid),
        eitype = '[' + elen + ' x i8]',
        estr = 'c"' + eid + '\\00"';
      vlist.push('i8* getelementptr inbounds (' + eitype + '* ' + eidstr + ', i32 0, i32 0)');
      ir.push([eidstr + ' = private unnamed_addr constant ' + eitype + ' ' + estr]);
      // Each enumeration element is a var declaration
      allocate_variable(ir, 'var_decl', eid.toUpperCase(), fname, type, i);
    }
    // Declare the array of strings for the enum values so that
    // we can print them out if needed
    ir.push([type.enum_var + ' = global ' + type.enum_type + ' [ ' + vlist.join(", ") + ' ]']);
    return type;
  }

  // normalizeIR takes a JSON IR
  function normalizeIR(ir) {
    var prefix = [], body = [];
    body.push("");
    for (var i = 0; i < ir.length; i++) {
      if (typeof (ir[i]) === "object") {
        prefix.push.apply(prefix, ir[i]);
      } else {
        body.push(ir[i]);
      }
    }
    return (prefix.concat(body)).join("\n");
  }

  function toIR(astTree, level, fnames) {
    var ast = (typeof astTree === 'undefined') ? theAST : astTree,
      indent = "",
      fname, node,
      ir = [];
    if (!ast) {
      throw new Error("Warning: toIR called with empty/null AST");
    }
    node = ast.node,
      level = level ? level : 0;
    fnames = fnames ? fnames : [];
    fname = fnames[fnames.length - 1];
    for (var i = 0; i < level; i++) {
      indent = indent + "  ";
    }

    if (typeof ast.lineno === 'number' && ast.lineno > 0) {
      cur_line = ast.lineno;
      st.lookup('_settings_').cur_line = cur_line;
    }

    switch (node) {
      case 'program':
        // Similar to a proc_decl but with declarations and called by
        // @main
        var id = ast.id,
          fparams = ast.fparams,
          block = ast.block;

        // The program's own name is not an identifier of the program (it
        // lives under a reserved key so that e.g. "var counter" in program
        // "Counter" works).
        st.insert('$MAIN', { name: id, level: level, fparams: fparams, lparams: [] });

        // Define some predefined variables/constants
        allocate_enums(ir, ['FALSE', 'TRUE'], '$MAIN',
          { node: 'type', name: 'BOOLEAN' }, 'i1');
        allocate_variable(ir, 'const_decl', 'PI', '$MAIN',
          normalize_type({ node: 'type', name: 'REAL' }),
          ieee754.llvm_float_hex(3.1415926536));
        allocate_variable(ir, 'const_decl', 'MAXINT', '$MAIN',
          normalize_type({ node: 'type', name: 'INTEGER' }), 32767);

        // Predeclared types
        st.insert('TEXT', { node: 'type_decl', id: 'TEXT', type: { node: 'type', name: 'TEXT' } });

        block.param_list = [];
        ir.push.apply(ir, toIR(block, level, fnames.concat(['$MAIN'])));
        ir.push(extra_decls);

        ir.push('');
        ir.push('');
        ir.push('define i32 @main() {');
        ir.push('entry:');
        ir.push('  %ret = call i32 @' + id + '()');
        ir.push('  ret i32 0');
        ir.push('}');
        break;

      case 'block':
        var uses = ast.uses,
          decls = ast.decls,
          stmts = ast.stmts,
          pdecl = st.lookup(fname),
          lparams = pdecl.lparams,
          fparams = pdecl.fparams,
          param_list = [],
          lparam_list = [],
          unit_init_ir = [],
          unit_stop_ir = [],
          pdecl_ir = [],
          vdecl_ir = [],
          stmts_ir = [];

        /* Evaluate libraries specified in the 'uses' declaration */
        if (uses) {
          // Loaded by default
          var unit_list = default_units.slice();

          /* user specified */
          for (var i = 0; i < uses.length; i++) {
            if (unit_list.indexOf(uses[i]) < 0) {
              unit_list.push(uses[i]);
            }
          }

          for (var i = 0; i < unit_list.length; i++) {
            var unit = unit_list[i],
              lib = load_unit(unit);
            unit_init_ir.push.apply(unit_init_ir, lib.init());
            unit_stop_ir.push.apply(unit_stop_ir, lib.stop());
          }
        }

        // Regular formal parameters
        for (var i = 0; i < fparams.length; i++) {
          var fparam = fparams[i];
          fparam.type = normalize_type(fparam.type);
          var ftype = fparam.type,
            lltype = ftype.lltype,
            pname = "%" + st.new_name(fparam.id + "_fparam"),
            sname = "%" + st.new_name(fparam.id + "_fparam_stack");
          if (fparam.var) {
            vdecl_ir.push('  ' + pname + ' = load ' + lltype + '* ' + sname);
            param_list.push(lltype + '* ' + sname);
          } else {
            vdecl_ir.push('  ' + sname + ' = alloca ' + lltype);
            vdecl_ir.push('  store ' + lltype + ' ' + pname + ', ' + lltype + '* ' + sname);
            param_list.push(lltype + ' ' + pname);
          }
          st.insert(fparam.id, { node: 'var_decl', type: ftype, pname: pname, sname: sname, var: fparam.var, level: level });
        }

        // Exit leaves the current routine by jumping to this label
        var exit_label = st.new_name('exit');
        pdecl.exit_label = exit_label;

        // Record types get their LLVM names up front so that pointer types
        // declared earlier in the same type section can refer to them.
        for (var i = 0; i < decls.length; i++) {
          var fdecl = decls[i];
          if (fdecl.node === 'type_decl' && fdecl.type.name === 'RECORD') {
            fdecl.type.llname = new_llname(fdecl.id);
            pending_types[fdecl.id.toUpperCase()] = fdecl.type.llname;
          }
        }

        // Evaluate the children. We might need to modify the
        // param-list based on internal variables that refer to higher
        // level lexical scope
        var curAst = null;
        try {
          for (var i = 0; i < decls.length; i++) {
            var decl = decls[i];
            curAst = decl;
            if (decl.node === 'proc_decl' || decl.node === 'func_decl') {
              pdecl_ir.push.apply(pdecl_ir, toIR(decl, level, fnames));
            } else {
              vdecl_ir.push.apply(vdecl_ir, toIR(decl, level, fnames));
            }
          }
          for (var i = 0; i < stmts.length; i++) {
            curAst = stmts[i];
            stmts_ir.push.apply(stmts_ir, toIR(stmts[i], level, fnames));
          }
        } catch (e) {
          // Add the line number to the exception but only if it's not
          // already set, otherwise we would stomp a more specific
          // line number
          if (typeof e.lineno === 'undefined') {
            e.lineno = (typeof cur_line === 'number' && cur_line > 0) ? cur_line : curAst.lineno;
          }
          throw e;
        }

        // Variables that refer to higher lexical scope
        for (var i = 0; i < lparams.length; i++) {
          var lparam = lparams[i],
            ldecl = st.lookup(lparam.id),
            sname = ldecl.sname;
          ldecl.type = normalize_type(ldecl.type);
          lparam_list.push(ldecl.type.lltype + '* ' + sname);
        }
        param_list = lparam_list.concat(param_list);

        // Now output the IR
        // Add sub-program declarations at the top level
        var pitype = pdecl.itype || "i32";
        ir.push.apply(ir, pdecl_ir);
        ir.push('');
        ir.push('define ' + pitype + ' @' + pdecl.name + '(' + param_list.join(", ") + ') {');
        ir.push('entry:');
        ir.push.apply(ir, unit_init_ir);
        // For functions, add the return parameter
        if (pdecl.ireturn) {
          ir.push('  %retval = alloca ' + pitype);
        }
        // Add variable declarations inside the body definition
        ir.push.apply(ir, vdecl_ir);
        // Postpone variable declarations until inside the body
        ir.push.apply(ir, stmts_ir);
        ir.push('  br label %' + exit_label);
        ir.push(exit_label + ':');
        if (pdecl.ireturn) {
          ir.push('  %retreg = load ' + pitype + '* %retval');
          ir.push('  ret ' + pitype + ' %retreg');
        } else {
          ir.push('  ret ' + pitype + ' 0');
        }
        ir.push.apply(ir, unit_stop_ir);
        ir.push('}');
        break;

      case 'type_decl':
        var id = ast.id;
        ast.type = expand_type(ast.type);
        if (ast.type.name === 'ENUMERATION') {
          ast.type = allocate_enums(ir, ast.type.ids, fname, ast.type, 'i8');
        }
        ast.type = normalize_type(ast.type);
        st.insert(id, { node: 'type_decl', id: id, type: ast.type });
        break;

      case 'var_decl':
        ast.type = expand_type(ast.type);
        if (ast.type.name === 'ENUMERATION') {
          allocate_enums(ir, ast.type.ids, fname, ast.type, 'i8');
        }
        ast.type = normalize_type(ast.type);
        allocate_variable(ir, 'var_decl', ast.id, fname, ast.type);
        break;

      case 'const_decl':
        var id = ast.id,
          expr = ast.expr;

        ir.push.apply(ir, toIR(expr, level, fnames));
        expr.type = normalize_type(expr.type);

        var sname = allocate_variable(ir, 'const_decl', id, fname, expr.type, expr.val);

        ir.push('  store ' + expr.itype + ' ' + expr.ilocal + ', ' + expr.itype + '* ' + sname);
        break;

      case 'proc_decl':
      case 'func_decl':
        var id = ast.id,
          type = ast.type,
          fparams = ast.fparams,
          block = ast.block,
          new_level = level + 1;

        st.insert(id, { name: id, type: type, level: new_level, fparams: fparams, lparams: [] });
        if (block !== 'forward') {
          st.begin_scope();
          ir.push.apply(ir, toIR(block, new_level, fnames.concat([id])));
          st.end_scope();
        }
        break;

      case 'stmt_assign':
        var lvalue = ast.lvalue,
          expr = ast.expr;
        ir.push('  ; ASSIGN start');
        ir.push.apply(ir, toIR(expr, level, fnames));
        var litype = null, listack = null;

        if (lvalue.id === fname) {
          // This is actually a function name being used to set the
          // return value for the function so we don't evaluate the
          // lvalue
          var pdecl = st.lookup(fname);
          pdecl.type = normalize_type(pdecl.type);
          lvalue.type = pdecl.type;
          lvalue.itype = pdecl.type.lltype;
          pdecl.ireturn = true;
          pdecl.itype = lvalue.itype;
          st.replace(fname, pdecl);
          litype = lvalue.itype;
          listack = "%retval";
        } else {
          ir.push.apply(ir, toIR(lvalue, level, fnames));
          litype = lvalue.itype;
          listack = lvalue.istack;
        }

        if (lvalue.type.name === 'POINTER') {
          if (expr.node === 'nil') {
            ir.push('  store ' + litype + ' null, ' + litype + '* ' + listack);
          } else if (expr.type.name === 'POINTER' && expr.itype === litype) {
            ir.push('  store ' + litype + ' ' + expr.ilocal + ', ' + litype + '* ' + listack);
          } else {
            throw new Error("Cannot assign " + expr.type.name + " to a pointer of a different type");
          }
        } else if (lvalue.type.name === 'SET') {
          if (expr.type.name !== 'SET') {
            throw new Error("Cannot assign " + expr.type.name + " to a set");
          }
          ir.push('  store [32 x i8] ' + expr.ilocal + ', [32 x i8]* ' + listack);
        } else if (lvalue.type.name === 'STRING' && expr.type.origname === 'CHARACTER') {
          // a single character assigned to a string: build a 1 character string
          var cbuf = '%' + st.new_name('chrstr'),
            cptr = '%' + st.new_name('chrptr'),
            cend = '%' + st.new_name('chrend');
          ir.push('  ' + cbuf + ' = call i8* @malloc(i32 2)');
          ir.push('  store i8 ' + expr.ilocal + ', i8* ' + cbuf);
          ir.push('  ' + cend + ' = getelementptr inbounds i8* ' + cbuf + ', i32 1');
          ir.push('  store i8 0, i8* ' + cend);
          ir.push('  store i8* ' + cbuf + ', i8** ' + listack);
        } else if (lvalue.type.name === 'STRING' && expr.type.name === 'STRING' && expr.val) {
          // string literal being assigned to string variable
          ir.push('  store i8* getelementptr inbounds (' + expr.itype + ' ' + expr.istack + ', i32 0, i32 0), ' + litype + '* ' + listack);
        } else if (lvalue.type.name === 'STRING' && expr.type.name === 'STRING') {
          // string being assigned to string so malloc and copy
          var slen1 = '%' + st.new_name('slen'),
            slen2 = '%' + st.new_name('slen'),
            lvar = '%' + st.new_name('lvar'),
            decay1 = '%' + st.new_name('arraydecay'),
            decay2 = '%' + st.new_name('arraydecay'),
            chr = '%' + st.new_name('chr'),
            res = '%' + st.new_name('res');
          var srcstr = to_cstr(ir, expr);
          ir.push('  ' + slen1 + ' = call i32 @strlen(i8* ' + srcstr + ')');
          ir.push('  ' + slen2 + ' = add i32 1, ' + slen1);
          ir.push('  ' + lvar + ' = call i8* @malloc(i32 ' + slen2 + ')');
          ir.push('  store i8* ' + lvar + ', ' + litype + '* ' + listack);
          ir.push('  ' + res + ' = call i8* @strncpy(i8* ' + lvar + ', i8* ' + srcstr + ', i32 ' + slen2 + ')');
        } else if (lvalue.type.name === 'REAL' && expr.type.name === 'INTEGER') {
          // coerce integer to real
          var conv = st.new_name("%conv");
          ir.push('  ' + conv + ' = sitofp i32 ' + expr.ilocal + ' to float');
          ir.push('  store float ' + conv + ', ' + litype + '* ' + listack);
        } else if (lvalue.type.origname === 'BYTE' && expr.type.origname === 'INTEGER') {
          // coerce integer to byte
          var conv = st.new_name("%conv");
          ir.push('  ' + conv + ' = trunc i32 ' + expr.ilocal + ' to i8');
          ir.push('  store i8 ' + conv + ', ' + litype + '* ' + listack);
        } else if (lvalue.type.name !== expr.type.name) {
          throw new Error("Type of lvalue and expression do not match: " + lvalue.type.name + " vs " + expr.type.name);
        } else if (lvalue.type.origname !== expr.type.origname) {
          throw new Error("Subtype of lvalue and expression do not match: " + lvalue.type.origname + " vs " + expr.type.origname);
        } else {
          ir.push('  store ' + expr.itype + ' ' + expr.ilocal + ', ' + litype + '* ' + listack);
        }

        ast.itype = litype;
        ast.istack = listack;
        ast.ilocal = expr.ilocal;
        ir.push('  ; ASSIGN finish');
        break;

      case 'stmt_call':
      case 'expr_call':
        var id = ast.id, pdecl;
        if (node === 'stmt_call' && id === 'EXIT' && !st.find('EXIT')) {
          // leave the current procedure, function or the program
          var owner = st.lookup(fname);
          ir.push('  br label %' + owner.exit_label);
          ir.push(st.new_name('afterexit') + ':');
          break;
        }
        if (ast.qualifier && !(ast.qualifier.node === 'variable' && unit_names[ast.qualifier.id])) {
          throw new Error("'" + ast.id + "' is not a procedure or function of a unit");
        }
        try {
          pdecl = st.lookup(id);
        } catch (e) {
          throw new Error("Unknown function '" + id + "'");
        }
        var lparams = pdecl.lparams,
          fparams = pdecl.fparams,
          cparams = (ast.call_params || []);
        // evaluate the parameters
        for (var i = 0; i < cparams.length; i++) {
          ir.push.apply(ir, toIR(cparams[i], level, fnames));
          if (cparams[i].fmt_width) {
            ir.push.apply(ir, toIR(cparams[i].fmt_width, level, fnames));
            if (cparams[i].fmt_width.type.name !== 'INTEGER') {
              throw new Error("The field width must be an integer");
            }
          }
          if (cparams[i].fmt_decimals) {
            ir.push.apply(ir, toIR(cparams[i].fmt_decimals, level, fnames));
            if (cparams[i].fmt_decimals.type.name !== 'INTEGER') {
              throw new Error("The number of decimals must be an integer");
            }
          }
        }
        // Check that call params and formal params match length and
        // types
        if (fparams.length === 0 && cparams.length !== 0) {
          throw new Error("Parameter mismatch calling " + id + ": " +
            "parameter(s) given but none defined");
        }
        for (var i = 0; i < fparams.length; i++) {
          var cparam = cparams[i],
            fparam = fparams[i],
            ftype = fparam.type.name;
          if (ftype === 'varargs') {
            // We've checked as far as we can go on this side.
            // 'varargs' only applies to built-in unit routines and
            // must be done by the routine evalfn itself
            break;
          }
          if (ftype === 'any') {
            // The routine can accept multiple types in this position
            // so assume we're good and continue to the next argument.
            // 'any' only applies to built-in unit routines and
            // checking must be done by the routine evalfn itself
            continue;
          }
          if (!cparam) {
            throw new Error("Parameter mismatch calling " +
              id + ": more than " + i +
              " parameter(s) required but " + i +
              " given")
          }
          var cname = cparam.id ? cparam.id : "'" + cparam.val + "'",
            ctype = cparam.type,
            ctname = ctype.name,
            ctoname = ctype.origname;
          if (ftype === 'multiple') {
            var ftypes = fparam.type.names;
            if (ftypes.indexOf(ctname) < 0 &&
              ftypes.indexOf(ctoname) < 0) {
              throw new Error("Parameter mismatch calling " +
                id + ": " + cname + ":" + ctname +
                " given, but definition is " + ftypes);
            }
          } else {
            if (ctname !== ftype) {
              throw new Error("Parameter mismatch calling " +
                id + ": " + cname + ":" + ctname +
                " given, but definition is " + ftype);
            }
          }
        }
        if (pdecl.evalfn) {
          // This is a call to built-in unit routine and needs to be
          // evaluated (in a sense: macro expanded)
          ir.push.apply(ir, pdecl.evalfn(ast, cparams));
          if (ast.node === 'expr_call') {
            ast.type = normalize_type(ast.type);
          }
        } else {
          var param_list = [];
          for (var i = 0; i < lparams.length; i++) {
            var lparam = lparams[i],
              lltype = null;
            ir.push.apply(ir, toIR(lparam, level, fnames));
            lparam.type = normalize_type(lparam.type),
              param_list.push(lparam.type.lltype + "* " + lparam.istack);
          }
          for (var i = 0; i < cparams.length; i++) {
            var cparam = cparams[i],
              fparam = fparams[i];
            if (cparams[i].lparam) {
              throw new Error("TODO handle lparam in call");
            } else if (fparam.var) {
              param_list.push(cparam.itype + "* " + cparam.istack);
            } else if (fparam.type.name === 'STRING' && cparam.itype[0] === '[') {
              // TODO: above check is ugly, should be better way to distinguish character array from i8* string
              // coerce character array to i8*
              param_list.push('i8* getelementptr inbounds (' + cparam.itype + ' ' + cparam.istack + ', i32 0, i32 0)');
            } else {
              param_list.push(cparam.itype + " " + cparam.ilocal);
            }
          }
          if (node === 'expr_call') {
            var ret = '%' + st.new_name(pdecl.name + "_ret");
            pdecl.type = normalize_type(pdecl.type);
            var lltype = pdecl.type.lltype;
            ir.push('  ' + ret + ' = call ' + lltype + ' @' + pdecl.name + "(" + param_list.join(", ") + ")");
            ast.type = pdecl.type;
            ast.itype = lltype;
            ast.ilocal = ret;
          } else {
            ir.push('  call i32 @' + pdecl.name + "(" + param_list.join(", ") + ")");
          }
        }
        break;

      case 'stmt_compound':
        for (var i = 0; i < ast.stmts.length; i++) {
          ir.push.apply(ir, toIR(ast.stmts[i], level, fnames));
        }
        break;

      case 'stmt_if':
        var expr = ast.expr,
          tstmt = ast.tstmt,
          fstmt = ast.fstmt;
        ir.push('');
        ir.push('  ; if statement start');
        ir.push.apply(ir, toIR(expr, level, fnames));
        var br_name = st.new_name('br'),
          br_true = br_name + '_true',
          br_false = br_name + '_false',
          br_done = br_name + '_done';
        ir.push('  br ' + expr.itype + ' ' + expr.ilocal + ', label %' + br_true + ', label %' + br_false);
        ir.push(br_true + ':');
        if (tstmt) {
          ir.push.apply(ir, toIR(tstmt, level, fnames));
        }
        ir.push('  br label %' + br_done);
        ir.push(br_false + ':');
        if (fstmt) {
          ir.push.apply(ir, toIR(fstmt, level, fnames));
        }
        ir.push('  br label %' + br_done);
        ir.push(br_done + ':');
        ir.push('  ; if statement finish');
        ir.push('');
        break;

      case 'stmt_case':
        var expr = ast.expr,
          cases = ast.cases,
          otherwise_stmt = ast.otherwise_stmt,
          br_name = st.new_name('br'),
          br_done = br_name + '_done',
          case_val;

        ir.push('');
        ir.push('  ; case statement start');
        ir.push.apply(ir, toIR(expr, level, fnames));
        case_val = to_i32(ir, expr);

        // numeric value of a case label: literal, constant or enumeration id
        var case_const = function (index) {
          if (index.stype === 'variable') {
            var cdecl = st.find(index.val);
            if (!cdecl || !cdecl.type || typeof cdecl.type.default_value !== 'number') {
              throw new Error("Case label '" + index.val + "' is not a constant");
            }
            return cdecl.type.default_value;
          }
          return index.val;
        };

        for (var i = 0; i < cases.length; i++) {
          var indexes = cases[i].indexes,
            stmt = cases[i].stmt;
          for (var j = 0; j < indexes.length; j++) {
            var index = indexes[j],
              cmp = st.new_name('%' + br_name + '_cmp'),
              cmp2 = st.new_name('%' + br_name + '_cmp'),
              br_curr = st.new_name(br_name),
              br_curr2 = st.new_name(br_name),
              br_next = st.new_name(br_name);
            if (index.node === 'constant') {
              ir.push('  ' + cmp + ' = icmp eq i32 ' + case_const(index) + ', ' + case_val);
              ir.push('  br i1 ' + cmp + ', label %' + br_curr + ', label %' + br_next);
            } else {
              var lo = case_const(index.start), hi = case_const(index.end);
              ir.push('  ' + cmp + ' = icmp sgt i32 ' + lo + ', ' + case_val);
              ir.push('  br i1 ' + cmp + ', label %' + br_next + ', label %' + br_curr2);
              ir.push(br_curr2 + ':');
              ir.push('  ' + cmp2 + ' = icmp slt i32 ' + hi + ', ' + case_val);
              ir.push('  br i1 ' + cmp2 + ', label %' + br_next + ', label %' + br_curr);
            }
            ir.push(br_curr + ':');
            ir.push.apply(ir, toIR(stmt, level, fnames));
            ir.push('  br label %' + br_done);
            ir.push(br_next + ':');
          }
        }
        if (otherwise_stmt) {
          ir.push('  ; case statement otherwise');
          if (Array.isArray(otherwise_stmt)) {
            for (var i = 0; i < otherwise_stmt.length; i++) {
              ir.push.apply(ir, toIR(otherwise_stmt[i], level, fnames));
            }
          } else {
            ir.push.apply(ir, toIR(otherwise_stmt, level, fnames));
          }
        }
        ir.push('  br label %' + br_done);
        ir.push(br_done + ':');
        ir.push('  ; case statement finish');
        break;

      case 'stmt_for':
        // The loop is driven by a hidden i32 counter so that the control
        // variable can be a char, boolean, subrange or enumeration value.
        var index = ast.index,
          start = ast.start,
          by = ast.by,
          end = ast.end,
          stmt = ast.stmt,
          for_label = st.new_name('for'),
          for_cond = for_label + 'cond',
          for_body = for_label + 'body',
          for_inc = for_label + 'inc',
          for_end = for_label + 'end',
          counter = '%' + for_label + 'ctr',
          limit = '%' + for_label + 'lim',
          cur = '%' + for_label + 'cur',
          cmp = '%' + for_label + 'cmp',
          nxt = '%' + for_label + 'nxt',
          cvt = '%' + for_label + 'cvt',
          start32, end32;

        ir.push('');
        ir.push('  ; for statement start');

        ir.push.apply(ir, toIR(index, level, fnames));
        if (!isScalar(index.type)) {
          throw new Error("The control variable of a FOR loop must be an ordinal variable");
        }
        ir.push.apply(ir, toIR(start, level, fnames));
        ir.push.apply(ir, toIR(end, level, fnames));
        start32 = to_i32(ir, start);
        end32 = to_i32(ir, end);

        ir.push('  ' + counter + ' = alloca i32');
        ir.push('  ' + limit + ' = alloca i32');
        ir.push('  store i32 ' + start32 + ', i32* ' + counter);
        ir.push('  store i32 ' + end32 + ', i32* ' + limit);
        ir.push('  br label %' + for_cond);

        ir.push('');
        ir.push(for_cond + ':');
        ir.push('  ' + cur + ' = load i32* ' + counter);
        ir.push('  ' + cmp + ' = icmp ' + (by === 1 ? 'sle' : 'sge') + ' i32 ' + cur + ', ' + end32);
        ir.push('  br i1 ' + cmp + ', label %' + for_body + ', label %' + for_end);

        ir.push('');
        ir.push(for_body + ':');
        if (index.itype === 'i32') {
          ir.push('  store i32 ' + cur + ', i32* ' + index.istack);
        } else {
          ir.push('  ' + cvt + ' = trunc i32 ' + cur + ' to ' + index.itype);
          ir.push('  store ' + index.itype + ' ' + cvt + ', ' + index.itype + '* ' + index.istack);
        }
        ir.push.apply(ir, toIR(stmt, level, fnames));
        ir.push('  br label %' + for_inc);

        ir.push('');
        ir.push(for_inc + ':');
        ir.push('  ' + nxt + ' = add i32 ' + cur + ', ' + by);
        ir.push('  store i32 ' + nxt + ', i32* ' + counter);
        ir.push('  br label %' + for_cond);

        ir.push('');
        ir.push(for_end + ':');
        ir.push('  ; for statement finish');
        ir.push('');
        break;

      case 'stmt_with':
        // Every field name of the record(s) shadows the variables of the
        // enclosing scope inside the statement.
        // 'with a, b do S' is 'with a do with b do S': b may use a's fields.
        var body = ast.stmt, recs = [];
        for (var w = 0; w < ast.lvalues.length; w++) {
          var wl = clone_ast(ast.lvalues[w]);
          for (var k = recs.length - 1; k >= 0; k--) {
            wl = resolve_with(wl, recs[k].fields, recs[k].lvalue);
          }
          // type the record by translating a throw-away copy
          var probe = clone_ast(wl);
          toIR(probe, level, fnames);
          var wtype = expand_type(probe.type);
          if (wtype.name !== 'RECORD') {
            throw new Error("WITH requires a record variable");
          }
          recs.push({ lvalue: wl, fields: wtype.field_map });
        }
        for (var k = recs.length - 1; k >= 0; k--) {
          body = resolve_with(body, recs[k].fields, recs[k].lvalue);
        }
        ir.push.apply(ir, toIR(body, level, fnames));
        break;

      case 'stmt_repeat':
        var expr = ast.expr,
          stmts = ast.stmts,
          repeat_label = st.new_name('repeat'),
          repeat_cond = repeat_label + 'cond',
          repeat_body = repeat_label + 'body',
          repeat_end = repeat_label + 'end';

        ir.push('');
        ir.push('  ; repeat statement start');

        ir.push('  br label %' + repeat_body);

        ir.push('');
        ir.push(repeat_body + ':');
        for (var i = 0; i < stmts.length; i++) {
          ir.push.apply(ir, toIR(stmts[i], level, fnames));
        }
        ir.push('  br label %' + repeat_cond);

        ir.push('');
        ir.push(repeat_cond + ':');
        ir.push.apply(ir, toIR(expr, level, fnames));
        ir.push('  br i1 ' + expr.ilocal + ', label %' + repeat_end + ', label %' + repeat_body);

        ir.push('');
        ir.push(repeat_end + ':');

        ir.push('  ; repeat statement finish');
        ir.push('');
        break;

      case 'stmt_while':
        var expr = ast.expr,
          stmt = ast.stmt,
          while_label = st.new_name('while'),
          while_cond = while_label + 'cond',
          while_body = while_label + 'body',
          while_end = while_label + 'end';

        ir.push('');
        ir.push('  ; while statement start');

        ir.push('  br label %' + while_cond);

        ir.push('');
        ir.push(while_cond + ':');
        ir.push.apply(ir, toIR(expr, level, fnames));
        ir.push('  br i1 ' + expr.ilocal + ', label %' + while_body + ', label %' + while_end);

        ir.push('');
        ir.push(while_body + ':');
        ir.push.apply(ir, toIR(stmt, level, fnames));
        ir.push('  br label %' + while_cond);

        ir.push('');
        ir.push(while_end + ':');

        ir.push('  ; while statement finish');
        ir.push('');
        break;

      case 'expr_binop':
        var left = ast.left, ltype,
          right = ast.right, rtype,
          resType = null, op = ast.op,
          dest_name = '%' + st.new_name("binop"),
          cmpLookup = {
            gt: 'sgt', lt: 'slt',
            geq: 'sge', leq: 'sle',
            eq: 'eq', neq: 'ne'
          },
          fcmpLookup = {
            gt: 'ogt', lt: 'olt',
            geq: 'oge', leq: 'ole',
            eq: 'oeq', neq: 'une'
          },
          boolType = function () { return normalize_type({ node: 'type', name: 'BOOLEAN' }); },
          intType = function () { return normalize_type({ node: 'type', name: 'INTEGER' }); },
          isCmp = (op in { gt: 1, lt: 1, geq: 1, leq: 1, eq: 1, neq: 1 }),
          bothNil = false, tmp;

        ir.push.apply(ir, toIR(left, level, fnames));
        ir.push.apply(ir, toIR(right, level, fnames));
        if (left.node !== 'nil') { ltype = left.type = normalize_type(left.type); }
        if (right.node !== 'nil') { rtype = right.type = normalize_type(right.type); }
        var msgPrefix = "Operands for '" + op + "' ";

        if (op === 'in') {
          // membership: ordinal in set
          if (rtype.name !== 'SET') {
            throw new Error("The right operand of 'in' must be a set, not " + rtype.name);
          }
          if (ltype.name !== 'INTEGER') {
            throw new Error("The left operand of 'in' must be an ordinal value, not " + ltype.name);
          }
          set_helpers();
          var member = to_i32(ir, left),
            members = set_address(ir, right);
          ir.push('  ' + dest_name + ' = call i1 @_pascal_set_has([32 x i8]* ' + members + ', i32 ' + member + ')');
          resType = boolType();
        } else if ((left.node === 'nil' || (ltype && ltype.name === 'POINTER')) &&
          (right.node === 'nil' || (rtype && rtype.name === 'POINTER'))) {
          // pointer comparison
          if (op !== 'eq' && op !== 'neq') {
            throw new Error(msgPrefix + "cannot be applied to pointers");
          }
          var ptrType = left.node === 'nil' ? right.itype : left.itype,
            lp = left.node === 'nil' ? 'null' : left.ilocal,
            rp = right.node === 'nil' ? 'null' : right.ilocal;
          if (left.node !== 'nil' && right.node !== 'nil' && left.itype !== right.itype) {
            throw new Error(msgPrefix + "are pointers to different types");
          }
          ir.push('  ' + dest_name + ' = icmp ' + cmpLookup[op] + ' ' + ptrType + ' ' + lp + ', ' + rp);
          resType = boolType();
        } else if (left.node === 'nil' || right.node === 'nil') {
          throw new Error("nil can only be compared with pointers");
        } else if (ltype.name === 'SET' || rtype.name === 'SET') {
          if (ltype.name !== rtype.name) {
            throw new Error(msgPrefix + "are not the same type: " + ltype.name + " and " + rtype.name);
          }
          set_helpers();
          var sa = set_address(ir, left), sb = set_address(ir, right);
          if (isCmp) {
            if (op === 'gt' || op === 'lt') {
              throw new Error(msgPrefix + "cannot be applied to sets");
            }
            var mode = (op === 'eq' || op === 'neq') ? 0 : 1,
              first = op === 'geq' ? sb : sa,
              second = op === 'geq' ? sa : sb,
              cmpReg = '%' + st.new_name('setcmp');
            ir.push('  ' + cmpReg + ' = call i1 @_pascal_set_cmp([32 x i8]* ' + first + ', [32 x i8]* ' + second + ', i32 ' + mode + ')');
            if (op === 'neq') {
              ir.push('  ' + dest_name + ' = xor i1 1, ' + cmpReg);
            } else {
              dest_name = cmpReg;
            }
            resType = boolType();
          } else if (op === 'plus' || op === 'minus' || op === 'star') {
            var res = '%' + st.new_name('setres'),
              code = op === 'plus' ? 0 : (op === 'star' ? 1 : 2);
            ir.push('  ' + res + ' = alloca [32 x i8]');
            ir.push('  call void @_pascal_set_op([32 x i8]* ' + res + ', [32 x i8]* ' + sa + ', [32 x i8]* ' + sb + ', i32 ' + code + ')');
            dest_name = '%' + st.new_name('setval');
            ir.push('  ' + dest_name + ' = load [32 x i8]* ' + res);
            ast.istack = res;
            resType = ltype.literal && !rtype.literal ? rtype : ltype;
          } else {
            throw new Error(msgPrefix + "cannot be applied to sets");
          }
        } else if ((ltype.name === 'STRING' || ltype.origname === 'CHARACTER') &&
          (rtype.name === 'STRING' || rtype.origname === 'CHARACTER') &&
          (ltype.name === 'STRING' || rtype.name === 'STRING')) {
          if (op === 'plus') {
            // string concatenation shorthand
            var fake_expr = { node: 'expr_call', id: 'CONCAT', call_params: [left, right] };
            ir.push.apply(ir, toIR(fake_expr, level, fnames));
            dest_name = fake_expr.ilocal;
            resType = normalize_type({ node: 'type', name: 'STRING' });
          } else if (isCmp) {
            var sl = to_cstr(ir, left), sr = to_cstr(ir, right),
              cres = '%' + st.new_name('strcmp');
            define_helper('strcmp', ['declare i32 @strcmp(i8*, i8*)']);
            ir.push('  ' + cres + ' = call i32 @strcmp(i8* ' + sl + ', i8* ' + sr + ')');
            ir.push('  ' + dest_name + ' = icmp ' + cmpLookup[op] + ' i32 ' + cres + ', 0');
            resType = boolType();
          } else {
            throw new Error("Operator '" + op + "' cannot be applied to strings");
          }
        } else if (ltype.name === 'REAL' || rtype.name === 'REAL') {
          // real arithmetic and comparison (integers are converted)
          var lreal = left.ilocal, rreal = right.ilocal;
          if (ltype.name === 'INTEGER') {
            lreal = '%' + st.new_name('conv');
            ir.push('  ' + lreal + ' = sitofp i32 ' + to_i32(ir, left) + ' to float');
          } else if (ltype.name !== 'REAL') {
            throw new Error("No defined behavior for " + ltype.name + " " + op + " " + rtype.name);
          }
          if (rtype.name === 'INTEGER') {
            rreal = '%' + st.new_name('conv');
            ir.push('  ' + rreal + ' = sitofp i32 ' + to_i32(ir, right) + ' to float');
          } else if (rtype.name !== 'REAL') {
            throw new Error("No defined behavior for " + ltype.name + " " + op + " " + rtype.name);
          }
          if (isCmp) {
            ir.push('  ' + dest_name + ' = fcmp ' + fcmpLookup[op] + ' float ' + lreal + ', ' + rreal);
            resType = boolType();
          } else if (op in { plus: 1, minus: 1, star: 1, slash: 1 }) {
            if (op === 'slash') {
              var zero = '%' + st.new_name('zero');
              ir.push('  ' + zero + ' = fcmp oeq float ' + rreal + ', ' + ieee754.llvm_float_hex(0.0));
              emit_check(ir, zero, TRAP.DIVZERO);
            }
            var fop = { plus: 'fadd', minus: 'fsub', star: 'fmul', slash: 'fdiv' }[op];
            ir.push('  ' + dest_name + ' = ' + fop + ' float ' + lreal + ', ' + rreal);
            resType = normalize_type({ node: 'type', name: 'REAL' });
          } else {
            throw new Error("Operator '" + op + "' cannot be applied to real numbers");
          }
        } else if (ltype.name === 'INTEGER' && rtype.name === 'INTEGER') {
          // integer-like operands: integers, subranges, bytes, chars, booleans, enumerations
          var li = to_i32(ir, left), ri = to_i32(ir, right);
          if (isCmp) {
            if (ltype.origname !== rtype.origname &&
              (ltype.origname === 'BOOLEAN' || rtype.origname === 'BOOLEAN' ||
                ltype.origname === 'ENUMERATION' || rtype.origname === 'ENUMERATION' ||
                ltype.origname === 'CHARACTER' || rtype.origname === 'CHARACTER')) {
              throw new Error(msgPrefix + "are not the same type: " + describe_type(ltype) + " and " + describe_type(rtype));
            }
            ir.push('  ' + dest_name + ' = icmp ' + cmpLookup[op] + ' i32 ' + li + ', ' + ri);
            resType = boolType();
          } else if (op in { plus: 1, minus: 1, star: 1 }) {
            ir.push('  ' + dest_name + ' = ' + { plus: 'add', minus: 'sub', star: 'mul' }[op] + ' i32 ' + li + ', ' + ri);
            resType = intType();
          } else if (op === 'slash') {
            // real division of integers
            var lf = '%' + st.new_name('conv'), rf = '%' + st.new_name('conv'), zero2 = '%' + st.new_name('zero');
            ir.push('  ' + lf + ' = sitofp i32 ' + li + ' to float');
            ir.push('  ' + rf + ' = sitofp i32 ' + ri + ' to float');
            ir.push('  ' + zero2 + ' = icmp eq i32 ' + ri + ', 0');
            emit_check(ir, zero2, TRAP.DIVZERO);
            ir.push('  ' + dest_name + ' = fdiv float ' + lf + ', ' + rf);
            resType = normalize_type({ node: 'type', name: 'REAL' });
          } else if (op === 'div' || op === 'mod') {
            var zero3 = '%' + st.new_name('zero');
            ir.push('  ' + zero3 + ' = icmp eq i32 ' + ri + ', 0');
            emit_check(ir, zero3, TRAP.DIVZERO);
            ir.push('  ' + dest_name + ' = ' + (op === 'div' ? 'sdiv' : 'srem') + ' i32 ' + li + ', ' + ri);
            resType = intType();
          } else if (op === 'and' || op === 'or' || op === 'xor') {
            if (ltype.origname === 'BOOLEAN' && rtype.origname === 'BOOLEAN') {
              ir.push('  ' + dest_name + ' = ' + op + ' i1 ' + left.ilocal + ', ' + right.ilocal);
              resType = boolType();
            } else if (ltype.origname === 'BOOLEAN' || rtype.origname === 'BOOLEAN') {
              throw new Error("Operator '" + op + "' needs two boolean or two integer operands");
            } else {
              ir.push('  ' + dest_name + ' = ' + op + ' i32 ' + li + ', ' + ri);
              resType = intType();
            }
          } else if (op === 'shl' || op === 'shr') {
            ir.push('  ' + dest_name + ' = ' + (op === 'shl' ? 'shl' : 'ashr') + ' i32 ' + li + ', ' + ri);
            resType = intType();
          } else {
            throw new Error("Unexpected expr_binop operand " + op);
          }
        } else {
          throw new Error("No defined behavior for " + describe_type(ltype) + " " + op + " " + describe_type(rtype));
        }
        ast.type = resType;
        ast.itype = resType.lltype;
        ast.ilocal = dest_name;
        break;

      case 'expr_unop':
        var expr = ast.expr,
          dest_name = '%' + st.new_name("unop");
        ir.push.apply(ir, toIR(expr, level, fnames));
        var etype = normalize_type(expr.type);
        switch (ast.op) {
          case 'minus':
            if (etype.name === 'REAL') {
              ir.push('  ' + dest_name + ' = fsub float ' + ieee754.llvm_float_hex(0.0) + ', ' + expr.ilocal);
              ast.type = etype;
              ast.itype = 'float';
            } else if (etype.name === 'INTEGER' && !etype.ids) {
              ir.push('  ' + dest_name + ' = sub i32 0, ' + to_i32(ir, expr));
              ast.type = normalize_type({ node: 'type', name: 'INTEGER' });
              ast.itype = 'i32';
            } else {
              throw new Error("Cannot negate a value of type " + describe_type(etype));
            }
            break;
          case 'not':
            if (etype.origname === 'BOOLEAN') {
              ir.push('  ' + dest_name + ' = xor i1 1, ' + expr.ilocal);
              ast.type = etype;
              ast.itype = 'i1';
            } else if (etype.name === 'INTEGER' && !etype.ids) {
              ir.push('  ' + dest_name + ' = xor i32 -1, ' + to_i32(ir, expr));
              ast.type = normalize_type({ node: 'type', name: 'INTEGER' });
              ast.itype = 'i32';
            } else {
              throw new Error("'not' needs a boolean or integer operand, not " + describe_type(etype));
            }
            break;
          default: throw new Error("Unexpected expr_unop operand " + ast.op);
        }
        ast.ilocal = dest_name;
        break;

      case 'expr_array_deref':
        var lvalue = ast.lvalue,
          expr = ast.expr;
        ir.push.apply(ir, toIR(expr, level, fnames));
        ir.push.apply(ir, toIR(lvalue, level, fnames));

        var atype = lvalue.type,
          start, rtype, ritype,
          aname = '%' + st.new_name(deref_name(ast)),
          sub = aname + 'sub',
          aptr1 = aname + 'ptr1',
          aoff = aname + 'off',
          aval = aname + 'val',
          idx;
        if (atype.name !== 'ARRAY' && atype.name !== 'STRING') {
          throw new Error("Only arrays and strings can be indexed (found " + describe_type(atype) + ")");
        }
        idx = to_i32(ir, expr);
        start = atype.index.start;
        rtype = atype.type;
        ritype = atype.type.lltype;
        if (atype.name === 'STRING') {
          // 1-based index into a NUL-terminated string; must be within the length
          var cstr = '%' + st.new_name('sref'), slen = '%' + st.new_name('slen'),
            slen32 = '%' + st.new_name('slen'), lo = '%' + st.new_name('lo'),
            hi = '%' + st.new_name('hi'), bad = '%' + st.new_name('bad');
          ir.push('  ' + aptr1 + ' = load ' + atype.lltype + '* ' + lvalue.istack);
          var safeptr = to_cstr(ir, { type: { name: 'STRING' }, itype: 'i8*', ilocal: aptr1 });
          ir.push('  ' + slen32 + ' = call i32 @strlen(i8* ' + safeptr + ')');
          void slen;
          ir.push('  ' + lo + ' = icmp slt i32 ' + idx + ', 1');
          ir.push('  ' + hi + ' = icmp sgt i32 ' + idx + ', ' + slen32);
          ir.push('  ' + bad + ' = or i1 ' + lo + ', ' + hi);
          emit_check(ir, bad, TRAP.RANGE);
          ir.push('  ' + sub + ' = sub i32 ' + idx + ', ' + start);
          ir.push('  ' + aoff + ' = getelementptr inbounds ' + atype.lltype + ' ' + aptr1 + ', i32 ' + sub);
          ir.push('  ' + aval + ' = load ' + atype.lltype + ' ' + aoff);
        } else {
          var alo = '%' + st.new_name('lo'), ahi = '%' + st.new_name('hi'), abad = '%' + st.new_name('bad');
          ir.push('  ' + alo + ' = icmp slt i32 ' + idx + ', ' + start);
          ir.push('  ' + ahi + ' = icmp sgt i32 ' + idx + ', ' + atype.index.end);
          ir.push('  ' + abad + ' = or i1 ' + alo + ', ' + ahi);
          emit_check(ir, abad, TRAP.RANGE);
          ir.push('  ' + sub + ' = sub i32 ' + idx + ', ' + start);
          ir.push('  ' + aoff + ' = getelementptr inbounds ' + atype.lltype + '* ' + lvalue.istack + ', i32 0, i32 ' + sub);
          ir.push('  ' + aval + ' = load ' + ritype + '* ' + aoff);
        }
        ast.type = rtype;
        ast.itype = ritype;
        ast.istack = aoff;
        ast.ilocal = aval;
        break;

      case 'expr_record_deref':
        var lvalue = ast.lvalue,
          comp = ast.component;
        if (lvalue.node === 'variable' && !st.find(lvalue.id) && unit_names[lvalue.id]) {
          // Unit.Identifier: the unit's declarations are global
          ast.node = 'variable';
          ast.id = comp;
          delete ast.lvalue;
          delete ast.component;
          ir.push.apply(ir, toIR(ast, level, fnames));
          break;
        }
        ir.push.apply(ir, toIR(lvalue, level, fnames));
        var rectype = lvalue.type;
        if (rectype.name !== 'RECORD') {
          throw new Error("'" + comp + "' cannot be selected: the expression before '.' is a " + describe_type(rectype) + ", not a record");
        }
        var fdesc = rectype.field_map[comp];
        if (!fdesc) {
          throw new Error("Record has no field '" + comp + "'");
        }
        var ctype = fdesc.type,
          clltype = ctype.lltype,
          rname = '%' + st.new_name(deref_name(ast)),
          roff = rname + '_off',
          rval = rname + '_val';
        if (fdesc.variant < 0) {
          ir.push('  ' + roff + ' = getelementptr inbounds ' + lvalue.itype + '* ' + lvalue.istack + ', i32 0, i32 ' + fdesc.index);
        } else {
          // variant field: address the shared payload as the variant's struct
          var payload = rname + '_payload', vcast = rname + '_vcast', vstruct = rectype.variant_structs[fdesc.variant];
          ir.push('  ' + payload + ' = getelementptr inbounds ' + lvalue.itype + '* ' + lvalue.istack + ', i32 0, i32 ' + rectype.payload_index);
          ir.push('  ' + vcast + ' = bitcast ' + rectype.payload_type + '* ' + payload + ' to ' + vstruct + '*');
          ir.push('  ' + roff + ' = getelementptr inbounds ' + vstruct + '* ' + vcast + ', i32 0, i32 ' + fdesc.index);
        }
        ir.push('  ' + rval + ' = load ' + clltype + '* ' + roff);
        ast.type = ctype;
        ast.itype = clltype;
        ast.istack = roff;
        ast.ilocal = rval;
        break;

      case 'expr_pointer_deref':
        var plvalue = ast.lvalue;
        ir.push.apply(ir, toIR(plvalue, level, fnames));
        var ptype = plvalue.type;
        if (ptype.name !== 'POINTER') {
          throw new Error("'^' can only follow a pointer (found " + describe_type(ptype) + ")");
        }
        var pointee = normalize_type(ptype.target),
          isnil = '%' + st.new_name('isnil'),
          pval = '%' + st.new_name('deref');
        ir.push('  ' + isnil + ' = icmp eq ' + plvalue.itype + ' ' + plvalue.ilocal + ', null');
        emit_check(ir, isnil, TRAP.NILPTR);
        ir.push('  ' + pval + ' = load ' + pointee.lltype + '* ' + plvalue.ilocal);
        ast.type = pointee;
        ast.itype = pointee.lltype;
        ast.istack = plvalue.ilocal;
        ast.ilocal = pval;
        break;

      case 'nil':
        ast.type = { node: 'type', name: 'NILTYPE' };
        ast.itype = 'i8*';
        ast.ilocal = 'null';
        break;

      case 'set_literal':
        set_helpers();
        var setvar = '%' + st.new_name('setlit'),
          setval = '%' + st.new_name('setval');
        ir.push('  ' + setvar + ' = alloca [32 x i8]');
        ir.push('  store [32 x i8] zeroinitializer, [32 x i8]* ' + setvar);
        for (var e = 0; e < ast.elems.length; e++) {
          var elem = ast.elems[e];
          ir.push.apply(ir, toIR(elem.lo, level, fnames));
          if (elem.lo.type.name !== 'INTEGER') {
            throw new Error("Set elements must be ordinal values, not " + describe_type(elem.lo.type));
          }
          var lov = to_i32(ir, elem.lo);
          if (elem.hi) {
            ir.push.apply(ir, toIR(elem.hi, level, fnames));
            var hiv = to_i32(ir, elem.hi);
            ir.push('  call void @_pascal_set_range([32 x i8]* ' + setvar + ', i32 ' + lov + ', i32 ' + hiv + ', i32 ' + cur_line + ')');
          } else {
            ir.push('  call void @_pascal_set_add([32 x i8]* ' + setvar + ', i32 ' + lov + ', i32 ' + cur_line + ')');
          }
        }
        ir.push('  ' + setval + ' = load [32 x i8]* ' + setvar);
        ast.type = { node: 'type', name: 'SET', literal: true, low: 0, high: 255, lltype: '[32 x i8]', default_value: 'zeroinitializer' };
        ast.itype = '[32 x i8]';
        ast.istack = setvar;
        ast.ilocal = setval;
        break;

      case 'real':
        ast.itype = "float";
        ast.ilocal = ieee754.llvm_float_hex(ast.val);
        break;
      case 'integer':
        ast.type.origname = 'INTEGER';
        ast.itype = "i32";
        ast.ilocal = ast.val;
        break;
      case 'character':
        ast.type.name = 'INTEGER';
        ast.type.origname = 'CHARACTER';
        ast.itype = "i8";
        ast.ilocal = ast.val;
        break;
      case 'string':
        var slen = ast.val.length + 1,
          re = /"/g,
          itype = '[' + slen + ' x i8]',
          sval = 'c"' + ast.val.replace(re, '\\22') + '\\00"',
          lname = '%' + st.new_name('string' + str_cnt),
          sname = '@.string' + (str_cnt++),
          lname;
        ir.push([sname + ' = global ' + itype + ' ' + sval]);
        ir.push('  ' + lname + ' = getelementptr inbounds ' + itype + '* ' + sname + ', i32 0');
        ast.itype = itype + '*';
        ast.ilocal = lname;
        ast.istack = sname;
        break;
      case 'boolean':
        ast.itype = "i1";
        ast.ilocal = ast.val.toString();
        break;
      case 'pointer':
        if (ast.id.length === 1) {
          try {
            var pdecl = st.lookup(ast.id);
          } catch (e) {
            // HACK: we could't determine at normal parse time if this is
            // a single character routine or if it's a control character
            // literal. If it's a single character and defined in the
            // symbol table then it's a pointer to a routine, otherwise
            // it's a control character so update the AST (i.e. late
            // parse)
            switch (ast.id) {
              case '@': ast.val = 0; break;
              case 'G': ast.val = 7; break;
              case 'H': ast.val = 8; break;
              case 'I': ast.val = 9; break;
              case 'J': ast.val = 10; break;
              case 'L': ast.val = 12; break;
              case 'M': ast.val = 13; break;
              case '[': ast.val = 27; break;
              case '?': ast.val = 127; break;
              default: throw new Error("Unknown control character " + ast.id);
            }
            ast.node = 'character';
            ast.type = { node: 'type', name: 'INTEGER', origname: 'CHARACTER' };
            ast.itype = "i8";
            ast.ilocal = ast.val;
            delete ast.id;
          }
        }
        break;

      case 'variable':
        var vdecl;
        try {
          vdecl = st.lookup(ast.id);
        } catch (e) {
          vdecl = null;
        }

        if (vdecl && vdecl.fparams) {
          // HACK: we could't determine at normal parse time if the ID
          // is a normal ID or a parameter function call. If it's
          // defined as a function, then assume this is actually
          // a parameterless function call expression so replace the
          // AST with a function and evalutate it
          ast.node = 'expr_call';
          ast.call_params = [];
          ir.push.apply(ir, toIR(ast, level, fnames));
          break;
        } else if (!vdecl) {
          throw new Error("Variable '" + ast.id + "' not found in symbol table or in libraries");
        }

        vdecl.type = normalize_type(vdecl.type);
        var id = ast.id,
          vtype = vdecl.type,
          vlevel = vdecl.level,
          lname = "%" + st.new_name(id + "_local");

        // Add variables from a higher lexical scope to our current
        // subprogram param list
        if (vlevel > 0 && level !== vlevel) {
          // Variable is in higher lexical scope, simulate static
          // link by passing the variable through intervening
          // sub-programs
          var new_pname, new_sname;
          for (var l = vlevel + 1; l <= level; l++) {
            var fname = fnames[l],
              pdecl = st.lookup(fname);
            new_pname = "%" + st.new_name(id + "_lparam");
            new_sname = new_pname + "_stack";
            // replace vdecl and insert it at this level
            vdecl = { node: 'var_decl', type: vtype, pname: new_pname, sname: new_sname, var: true, lparam: true, level: l };
            st.insert(id, vdecl, l);
            // add the variable to the lparams (lexical variables) 
            pdecl.lparams.push({ node: 'variable', id: id, type: vtype });
            st.replace(fname, pdecl);
          }
          ir.push('  ' + new_pname + ' = load ' + vtype.lltype + '* ' + new_sname + ' ; ' + l);
          ast.ilocal = new_pname;
          ast.istack = new_sname;
        }

        ir.push('  ' + lname + ' = load ' + vtype.lltype + '* ' + vdecl.sname);
        ast.type = vtype;
        ast.itype = vtype.lltype;
        ast.ilocal = lname;
        ast.istack = vdecl.sname;
        break;

      default:
        throw new Error("Unknown AST: " + JSON.stringify(ast));
    }

    return ir;
  }

  return {
    toIR: toIR,
    normalizeIR: normalizeIR,
    displayST: function () { st.display(); },
    getAST: function () { return theAST; }
  };
}

if (typeof module !== 'undefined') {
  var Parse = require('./parse'),
    ieee754 = require('./ieee754');

  exports.IR = IR;
  exports.toIR = function (ast) {
    var ir = new IR(ast);
    return ir.normalizeIR(ir.toIR());
  };

  exports.main = function commonjsMain(args) {
    if (!args[1]) {
      console.log('Usage: ' + args[0] + ' FILE');
      process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8"),
      ast = Parse.parser.parse(source);
    console.log(exports.toIR(ast));
  }
  if (require.main === module) {
    exports.main(process.argv.slice(1));
  }
}

// vim: expandtab:ts=2:sw=2:syntax=javascript
