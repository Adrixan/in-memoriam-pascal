// Built-in routines of the System unit (In Memoriam Pascal fork)
//
// Input is read character by character through helper functions written in
// LLVM IR on top of fgetc/ungetc. This keeps parsing of numbers and lines in
// one place, makes end of input detectable (the host can then ask the user for
// more input), and gives Pascal style run time errors for malformed input.

"use strict";

function SYSTEM(st) {
  var declared = {};

  // Emit a `declare` line only once per program
  function declare(ir, line) {
    if (!declared[line]) {
      declared[line] = true;
      ir.push([line]);
    }
  }

  function init() {
    var ir = [];

    ir.push(['declare i32 @printf(i8*, ...)']);
    ir.push(['declare i32 @fprintf(i8*, i8*, ...)']);
    ir.push(['declare double @drand48()']);
    ir.push(['declare void @exit(i32) noreturn nounwind']);
    ir.push(['declare void @memset(i8*, i8, i32)']);
    ir.push(['declare i32 @fgetc(i8*)']);
    ir.push(['declare i32 @ungetc(i32, i8*)']);
    ir.push(['declare i8* @fopen(i8*, i8*)']);
    ir.push(['declare i32 @fclose(i8*)']);
    ir.push(['declare double @atof(i8*)']);
    ir.push(['declare void @_pascal_need_input() noreturn']);
    ir.push(['declare void @_pascal_trap(i32, i32) noreturn']);
    ir.push(['']);
    ir.push(['%struct._IO_FILE = type { i32, i8* }']);
    ir.push(['%TEXT = type { i8*, i8* }']);
    ir.push(['@stdout = external global %struct._IO_FILE*']);
    ir.push(['@stdin = external global i8*']);
    ir.push(['declare i32 @fflush(%struct._IO_FILE*)']);
    ir.push(['']);
    ir.push(['@.newline = private constant [2 x i8] c"\\0A\\00"']);
    ir.push(['@.str_format = private constant [3 x i8] c"%s\\00"']);
    ir.push(['@.chr_format = private constant [3 x i8] c"%c\\00"']);
    ir.push(['@.int_format = private constant [3 x i8] c"%d\\00"']);
    ir.push(['@.float_format = private constant [4 x i8] c"% E\\00"']);
    ir.push(['@.str_wformat = private constant [4 x i8] c"%*s\\00"']);
    ir.push(['@.chr_wformat = private constant [4 x i8] c"%*c\\00"']);
    ir.push(['@.int_wformat = private constant [4 x i8] c"%*d\\00"']);
    ir.push(['@.float_wformat = private constant [5 x i8] c"%*E\\00"']);
    ir.push(['@.fixed_wformat = private constant [6 x i8] c"%*.*f\\00"']);
    ir.push(['@.mode_r = private constant [2 x i8] c"r\\00"']);
    ir.push(['@.mode_w = private constant [2 x i8] c"w\\00"']);
    ir.push(['@.mode_a = private constant [2 x i8] c"a\\00"']);
    ir.push(['']);

    // --- input helpers ------------------------------------------------
    ir.push([
      // The stream to read from: stdin when the handle is null
      'define i8* @_pascal_in(i8* %fp) {',
      'entry:',
      '  %isnull = icmp eq i8* %fp, null',
      '  %sin = load i8** @stdin',
      '  %r = select i1 %isnull, i8* %sin, i8* %fp',
      '  ret i8* %r',
      '}',
      // Next character; at the end of stdin the host asks for more input,
      // at the end of a file the program fails with run time error 100.
      'define i32 @_pascal_getc(i8* %fp, i32 %line) {',
      'entry:',
      '  %s = call i8* @_pascal_in(i8* %fp)',
      '  %c = call i32 @fgetc(i8* %s)',
      '  %eof = icmp slt i32 %c, 0',
      '  br i1 %eof, label %end, label %ok',
      'end:',
      '  %isstdin = icmp eq i8* %fp, null',
      '  br i1 %isstdin, label %need, label %ferr',
      'need:',
      '  call void @_pascal_need_input()',
      '  unreachable',
      'ferr:',
      '  call void @_pascal_trap(i32 100, i32 %line)',
      '  unreachable',
      'ok:',
      '  ret i32 %c',
      '}',
      'define void @_pascal_unget(i8* %fp, i32 %c) {',
      'entry:',
      '  %valid = icmp sge i32 %c, 0',
      '  br i1 %valid, label %do, label %done',
      'do:',
      '  %s = call i8* @_pascal_in(i8* %fp)',
      '  %r = call i32 @ungetc(i32 %c, i8* %s)',
      '  br label %done',
      'done:',
      '  ret void',
      '}',
      // skips blanks, returns the first other character
      'define i32 @_pascal_skip_blanks(i8* %fp, i32 %line) {',
      'entry:',
      '  br label %loop',
      'loop:',
      '  %c = call i32 @_pascal_getc(i8* %fp, i32 %line)',
      '  %sp = icmp eq i32 %c, 32',
      '  %tb = icmp eq i32 %c, 9',
      '  %nl = icmp eq i32 %c, 10',
      '  %cr = icmp eq i32 %c, 13',
      '  %w1 = or i1 %sp, %tb',
      '  %w2 = or i1 %nl, %cr',
      '  %w = or i1 %w1, %w2',
      '  br i1 %w, label %loop, label %done',
      'done:',
      '  ret i32 %c',
      '}',
      'define void @_pascal_read_int(i8* %fp, i32* %dst, i32 %line) {',
      'entry:',
      '  %val = alloca i32',
      '  %sign = alloca i32',
      '  %cur = alloca i32',
      '  store i32 0, i32* %val',
      '  store i32 1, i32* %sign',
      '  %c0 = call i32 @_pascal_skip_blanks(i8* %fp, i32 %line)',
      '  store i32 %c0, i32* %cur',
      '  %neg = icmp eq i32 %c0, 45',
      '  %pos = icmp eq i32 %c0, 43',
      '  %hassign = or i1 %neg, %pos',
      '  br i1 %hassign, label %takesign, label %first',
      'takesign:',
      '  %sv = select i1 %neg, i32 -1, i32 1',
      '  store i32 %sv, i32* %sign',
      '  %c2 = call i32 @_pascal_getc(i8* %fp, i32 %line)',
      '  store i32 %c2, i32* %cur',
      '  br label %first',
      'first:',
      '  %c3 = load i32* %cur',
      '  %d3 = sub i32 %c3, 48',
      '  %isd3 = icmp ult i32 %d3, 10',
      '  br i1 %isd3, label %loop, label %bad',
      'loop:',
      '  %c4 = load i32* %cur',
      '  %d4 = sub i32 %c4, 48',
      '  %isd4 = icmp ult i32 %d4, 10',
      '  br i1 %isd4, label %acc, label %fin',
      'acc:',
      '  %v = load i32* %val',
      '  %v10 = mul i32 %v, 10',
      '  %v2 = add i32 %v10, %d4',
      '  store i32 %v2, i32* %val',
      '  %s = call i8* @_pascal_in(i8* %fp)',
      '  %c5 = call i32 @fgetc(i8* %s)',
      '  store i32 %c5, i32* %cur',
      '  br label %loop',
      'fin:',
      '  %c6 = load i32* %cur',
      '  call void @_pascal_unget(i8* %fp, i32 %c6)',
      '  %vv = load i32* %val',
      '  %sg = load i32* %sign',
      '  %res = mul i32 %vv, %sg',
      '  store i32 %res, i32* %dst',
      '  ret void',
      'bad:',
      '  call void @_pascal_trap(i32 106, i32 %line)',
      '  unreachable',
      '}',
      'define void @_pascal_read_real(i8* %fp, float* %dst, i32 %line) {',
      'entry:',
      '  %buf = alloca [64 x i8]',
      '  %bp = getelementptr inbounds [64 x i8]* %buf, i32 0, i32 0',
      '  %n = alloca i32',
      '  %cur = alloca i32',
      '  store i32 0, i32* %n',
      '  %c0 = call i32 @_pascal_skip_blanks(i8* %fp, i32 %line)',
      '  store i32 %c0, i32* %cur',
      '  br label %loop',
      'loop:',
      '  %c = load i32* %cur',
      '  %d = sub i32 %c, 48',
      '  %isdig = icmp ult i32 %d, 10',
      '  %p1 = icmp eq i32 %c, 43',
      '  %p2 = icmp eq i32 %c, 45',
      '  %p3 = icmp eq i32 %c, 46',
      '  %p4 = icmp eq i32 %c, 69',
      '  %p5 = icmp eq i32 %c, 101',
      '  %o1 = or i1 %isdig, %p1',
      '  %o2 = or i1 %p2, %p3',
      '  %o3 = or i1 %p4, %p5',
      '  %o4 = or i1 %o1, %o2',
      '  %ok = or i1 %o4, %o3',
      '  %cnt = load i32* %n',
      '  %room = icmp slt i32 %cnt, 62',
      '  %take = and i1 %ok, %room',
      '  br i1 %take, label %store, label %fin',
      'store:',
      '  %slot = getelementptr inbounds [64 x i8]* %buf, i32 0, i32 %cnt',
      '  %ch = trunc i32 %c to i8',
      '  store i8 %ch, i8* %slot',
      '  %cnt2 = add i32 %cnt, 1',
      '  store i32 %cnt2, i32* %n',
      '  %s = call i8* @_pascal_in(i8* %fp)',
      '  %nc = call i32 @fgetc(i8* %s)',
      '  store i32 %nc, i32* %cur',
      '  br label %loop',
      'fin:',
      '  %cl = load i32* %cur',
      '  call void @_pascal_unget(i8* %fp, i32 %cl)',
      '  %len = load i32* %n',
      '  %empty = icmp eq i32 %len, 0',
      '  br i1 %empty, label %bad, label %conv',
      'conv:',
      '  %endp = getelementptr inbounds [64 x i8]* %buf, i32 0, i32 %len',
      '  store i8 0, i8* %endp',
      '  %dv = call double @atof(i8* %bp)',
      '  %fv = fptrunc double %dv to float',
      '  store float %fv, float* %dst',
      '  ret void',
      'bad:',
      '  call void @_pascal_trap(i32 106, i32 %line)',
      '  unreachable',
      '}',
      // reads the rest of the current line into buf (at most max-1 chars)
      'define void @_pascal_read_str(i8* %fp, i8* %buf, i32 %max, i32 %line) {',
      'entry:',
      '  %n = alloca i32',
      '  %got = alloca i32',
      '  store i32 0, i32* %n',
      '  store i32 0, i32* %got',
      '  %lim = sub i32 %max, 1',
      '  br label %loop',
      'loop:',
      '  %s = call i8* @_pascal_in(i8* %fp)',
      '  %c = call i32 @fgetc(i8* %s)',
      '  %eof = icmp slt i32 %c, 0',
      '  br i1 %eof, label %atend, label %chk',
      'atend:',
      '  %any = load i32* %got',
      '  %nothing = icmp eq i32 %any, 0',
      '  %isstdin = icmp eq i8* %fp, null',
      '  %ask = and i1 %nothing, %isstdin',
      '  br i1 %ask, label %need, label %done',
      'need:',
      '  call void @_pascal_need_input()',
      '  unreachable',
      'chk:',
      '  store i32 1, i32* %got',
      '  %isnl = icmp eq i32 %c, 10',
      '  br i1 %isnl, label %pushback, label %notnl',
      // the line end stays in the stream; ReadLn discards it afterwards
      'pushback:',
      '  call void @_pascal_unget(i8* %fp, i32 %c)',
      '  br label %done',
      'notnl:',
      '  %iscr = icmp eq i32 %c, 13',
      '  br i1 %iscr, label %loop, label %put',
      'put:',
      '  %cnt = load i32* %n',
      '  %full = icmp sge i32 %cnt, %lim',
      '  br i1 %full, label %loop, label %store',
      'store:',
      '  %slot = getelementptr inbounds i8* %buf, i32 %cnt',
      '  %ch = trunc i32 %c to i8',
      '  store i8 %ch, i8* %slot',
      '  %cnt2 = add i32 %cnt, 1',
      '  store i32 %cnt2, i32* %n',
      '  br label %loop',
      'done:',
      '  %len = load i32* %n',
      '  %endp = getelementptr inbounds i8* %buf, i32 %len',
      '  store i8 0, i8* %endp',
      '  ret void',
      '}',
      // discards the rest of the current line
      'define void @_pascal_skip_line(i8* %fp, i32 %line) {',
      'entry:',
      '  br label %loop',
      'loop:',
      '  %s = call i8* @_pascal_in(i8* %fp)',
      '  %c = call i32 @fgetc(i8* %s)',
      '  %eof = icmp slt i32 %c, 0',
      '  br i1 %eof, label %end, label %chk',
      'chk:',
      '  %nl = icmp eq i32 %c, 10',
      '  br i1 %nl, label %done, label %loop',
      'end:',
      '  %isstdin = icmp eq i8* %fp, null',
      '  br i1 %isstdin, label %need, label %done',
      'need:',
      '  call void @_pascal_need_input()',
      '  unreachable',
      'done:',
      '  ret void',
      '}',
      'define i1 @_pascal_eof(i8* %fp) {',
      'entry:',
      '  %s = call i8* @_pascal_in(i8* %fp)',
      '  %c = call i32 @fgetc(i8* %s)',
      '  %eof = icmp slt i32 %c, 0',
      '  br i1 %eof, label %yes, label %no',
      'yes:',
      '  ret i1 1',
      'no:',
      '  call void @_pascal_unget(i8* %fp, i32 %c)',
      '  ret i1 0',
      '}',
      'define i1 @_pascal_eoln(i8* %fp) {',
      'entry:',
      '  %s = call i8* @_pascal_in(i8* %fp)',
      '  %c = call i32 @fgetc(i8* %s)',
      '  %eof = icmp slt i32 %c, 0',
      '  br i1 %eof, label %yes, label %no',
      'yes:',
      '  ret i1 1',
      'no:',
      '  call void @_pascal_unget(i8* %fp, i32 %c)',
      '  %nl = icmp eq i32 %c, 10',
      '  ret i1 %nl',
      '}',
      // --- text files ---------------------------------------------------
      'define void @_pascal_file_assign(%TEXT* %f, i8* %name) {',
      'entry:',
      '  %np = getelementptr inbounds %TEXT* %f, i32 0, i32 0',
      '  store i8* %name, i8** %np',
      '  %fpp = getelementptr inbounds %TEXT* %f, i32 0, i32 1',
      '  store i8* null, i8** %fpp',
      '  ret void',
      '}',
      'define void @_pascal_file_close(%TEXT* %f) {',
      'entry:',
      '  %fpp = getelementptr inbounds %TEXT* %f, i32 0, i32 1',
      '  %fp = load i8** %fpp',
      '  %open = icmp ne i8* %fp, null',
      '  br i1 %open, label %do, label %done',
      'do:',
      '  %r = call i32 @fclose(i8* %fp)',
      '  store i8* null, i8** %fpp',
      '  br label %done',
      'done:',
      '  ret void',
      '}',
      // mode: 0 read, 1 write (truncate), 2 append
      'define void @_pascal_file_open(%TEXT* %f, i32 %mode, i32 %line) {',
      'entry:',
      '  call void @_pascal_file_close(%TEXT* %f)',
      '  %np = getelementptr inbounds %TEXT* %f, i32 0, i32 0',
      '  %name = load i8** %np',
      '  %unassigned = icmp eq i8* %name, null',
      '  br i1 %unassigned, label %noname, label %open',
      'noname:',
      '  call void @_pascal_trap(i32 102, i32 %line)',
      '  unreachable',
      'open:',
      '  %mr = getelementptr inbounds [2 x i8]* @.mode_r, i32 0, i32 0',
      '  %mw = getelementptr inbounds [2 x i8]* @.mode_w, i32 0, i32 0',
      '  %ma = getelementptr inbounds [2 x i8]* @.mode_a, i32 0, i32 0',
      '  %isw = icmp eq i32 %mode, 1',
      '  %m1 = select i1 %isw, i8* %mw, i8* %mr',
      '  %isa = icmp eq i32 %mode, 2',
      '  %m2 = select i1 %isa, i8* %ma, i8* %m1',
      '  %fp = call i8* @fopen(i8* %name, i8* %m2)',
      '  %failed = icmp eq i8* %fp, null',
      '  br i1 %failed, label %err, label %ok',
      'err:',
      '  %isread = icmp eq i32 %mode, 0',
      '  %code = select i1 %isread, i32 2, i32 5',
      '  call void @_pascal_trap(i32 %code, i32 %line)',
      '  unreachable',
      'ok:',
      '  %fpp = getelementptr inbounds %TEXT* %f, i32 0, i32 1',
      '  store i8* %fp, i8** %fpp',
      '  ret void',
      '}',
      'define i8* @_pascal_file_fp(%TEXT* %f, i32 %line) {',
      'entry:',
      '  %fpp = getelementptr inbounds %TEXT* %f, i32 0, i32 1',
      '  %fp = load i8** %fpp',
      '  %closed = icmp eq i8* %fp, null',
      '  br i1 %closed, label %err, label %ok',
      'err:',
      '  call void @_pascal_trap(i32 103, i32 %line)',
      '  unreachable',
      'ok:',
      '  ret i8* %fp',
      '}',
      // --- strings --------------------------------------------------------
      'declare i32 @strlen(i8*)',
      'declare i8* @strstr(i8*, i8*)',
      'declare i8* @strncpy(i8*, i8*, i32)',
      'declare i8* @malloc(i32)',
      'declare i32 @toupper(i32)',
      'declare i32 @tolower(i32)',
      '@.empty_sys = private constant [1 x i8] zeroinitializer',
      // never-null view of a string pointer
      'define i8* @_pascal_str(i8* %p) {',
      'entry:',
      '  %isnull = icmp eq i8* %p, null',
      '  %empty = getelementptr inbounds [1 x i8]* @.empty_sys, i32 0, i32 0',
      '  %r = select i1 %isnull, i8* %empty, i8* %p',
      '  ret i8* %r',
      '}',
      'define i8* @_pascal_copy(i8* %src, i32 %start, i32 %count) {',
      'entry:',
      '  %s = call i8* @_pascal_str(i8* %src)',
      '  %len = call i32 @strlen(i8* %s)',
      '  %lt1 = icmp slt i32 %start, 1',
      '  %st = select i1 %lt1, i32 1, i32 %start',
      '  %off = sub i32 %st, 1',
      '  %avail0 = sub i32 %len, %off',
      '  %neg = icmp slt i32 %avail0, 0',
      '  %avail = select i1 %neg, i32 0, i32 %avail0',
      '  %cneg = icmp slt i32 %count, 0',
      '  %cnt = select i1 %cneg, i32 0, i32 %count',
      '  %over = icmp sgt i32 %cnt, %avail',
      '  %n = select i1 %over, i32 %avail, i32 %cnt',
      '  %size = add i32 %n, 1',
      '  %buf = call i8* @malloc(i32 %size)',
      '  %from = getelementptr inbounds i8* %s, i32 %off',
      '  %c = call i8* @strncpy(i8* %buf, i8* %from, i32 %n)',
      '  %endp = getelementptr inbounds i8* %buf, i32 %n',
      '  store i8 0, i8* %endp',
      '  ret i8* %buf',
      '}',
      'define i32 @_pascal_pos(i8* %sub, i8* %str) {',
      'entry:',
      '  %a = call i8* @_pascal_str(i8* %sub)',
      '  %b = call i8* @_pascal_str(i8* %str)',
      '  %p = call i8* @strstr(i8* %b, i8* %a)',
      '  %none = icmp eq i8* %p, null',
      '  br i1 %none, label %zero, label %found',
      'zero:',
      '  ret i32 0',
      'found:',
      '  %pi = ptrtoint i8* %p to i32',
      '  %bi = ptrtoint i8* %b to i32',
      '  %d = sub i32 %pi, %bi',
      '  %r = add i32 %d, 1',
      '  ret i32 %r',
      '}',
    ]);

    return ir;
  }

  function stop() {
    return [];
  }

  // Source line of the statement being compiled is only known to the code
  // generator; routines that can fail pass it along through this hook.
  function curLine() {
    var s = st.find('_settings_');
    return (s && s.cur_line) || 0;
  }

  function reg(prefix) {
    return st.new_name('%' + prefix);
  }

  // value of an ordinal/char/boolean parameter as i32
  function as_i32(ir, p) {
    if (p.itype === 'i32') { return p.ilocal; }
    var r = reg('ext');
    ir.push('  ' + r + ' = zext ' + p.itype + ' ' + p.ilocal + ' to i32');
    return r;
  }

  function as_float(ir, p) {
    if (p.type.name === 'REAL') { return p.ilocal; }
    var r = reg('conv');
    ir.push('  ' + r + ' = sitofp i32 ' + as_i32(ir, p) + ' to float');
    return r;
  }

  // NUL terminated i8* for string or char parameter (never null)
  function as_cstr(ir, p) {
    var r = reg('cs');
    if (p.type.name === 'STRING') {
      if (p.itype[0] === '[') {
        ir.push('  ' + r + ' = bitcast ' + p.itype + ' ' + p.ilocal + ' to i8*');
        return r;
      }
      ir.push('  ' + r + ' = call i8* @_pascal_str(i8* ' + p.ilocal + ')');
      return r;
    }
    if (p.type.origname === 'CHARACTER') {
      var buf = reg('cb'), p0 = reg('cp'), p1 = reg('ce');
      ir.push('  ' + buf + ' = alloca [2 x i8]');
      ir.push('  ' + p0 + ' = getelementptr inbounds [2 x i8]* ' + buf + ', i32 0, i32 0');
      ir.push('  store i8 ' + p.ilocal + ', i8* ' + p0);
      ir.push('  ' + p1 + ' = getelementptr inbounds [2 x i8]* ' + buf + ', i32 0, i32 1');
      ir.push('  store i8 0, i8* ' + p1);
      return p0;
    }
    throw new Error("A string or character value is required");
  }

  function is_text(p) { return p.type && p.type.name === 'TEXT'; }
  function is_ordinal(t) { return t && t.name === 'INTEGER'; }

  //
  // I/O routines
  //

  // Split off a leading Text file argument; returns {file, rest}
  function split_file(cparams) {
    if (cparams.length > 0 && is_text(cparams[0])) {
      return { file: cparams[0], rest: cparams.slice(1) };
    }
    return { file: null, rest: cparams };
  }

  // Register holding the FILE* to use: null (stdin) or the handle of a Text
  function file_handle(ir, file, direct) {
    if (!file) { return 'null'; }
    var fp = reg('fp');
    ir.push('  ' + fp + ' = call i8* @_pascal_file_fp(%TEXT* ' + file.istack + ', i32 ' + curLine() + ')');
    return fp;
  }

  function READ(ast, cparams, isReadLn) {
    var ir = [], parts = split_file(cparams), fp, line = curLine();
    if (parts.file && parts.rest.length === 0 && !isReadLn) {
      throw new Error("Read needs a variable to read into");
    }
    ir.push('  ; READ start');
    fp = file_handle(ir, parts.file);
    for (var i = 0; i < parts.rest.length; i++) {
      var p = parts.rest[i], t = p.type;
      if (!p.istack || p.node === 'integer' || p.node === 'string' || p.node === 'character') {
        throw new Error("Read needs variables, not constants or expressions");
      }
      if (t.name === 'STRING') {
        var buf = reg('rbuf');
        ir.push('  ' + buf + ' = call i8* @malloc(i32 256)');
        ir.push('  call void @_pascal_read_str(i8* ' + fp + ', i8* ' + buf + ', i32 256, i32 ' + line + ')');
        ir.push('  store i8* ' + buf + ', i8** ' + p.istack);
      } else if (t.name === 'REAL') {
        ir.push('  call void @_pascal_read_real(i8* ' + fp + ', float* ' + p.istack + ', i32 ' + line + ')');
      } else if (t.name === 'INTEGER' && t.origname === 'CHARACTER') {
        var ch = reg('rch'), ch8 = reg('rch8');
        ir.push('  ' + ch + ' = call i32 @_pascal_getc(i8* ' + fp + ', i32 ' + line + ')');
        ir.push('  ' + ch8 + ' = trunc i32 ' + ch + ' to i8');
        ir.push('  store i8 ' + ch8 + ', i8* ' + p.istack);
      } else if (t.name === 'INTEGER' && (t.origname === 'BOOLEAN' || t.origname === 'ENUMERATION')) {
        throw new Error("Read cannot read boolean or enumeration values");
      } else if (t.name === 'INTEGER') {
        if (p.itype === 'i32') {
          ir.push('  call void @_pascal_read_int(i8* ' + fp + ', i32* ' + p.istack + ', i32 ' + line + ')');
        } else {
          var tmp = reg('rint'), v = reg('rval'), v8 = reg('rval8');
          ir.push('  ' + tmp + ' = alloca i32');
          ir.push('  call void @_pascal_read_int(i8* ' + fp + ', i32* ' + tmp + ', i32 ' + line + ')');
          ir.push('  ' + v + ' = load i32* ' + tmp);
          ir.push('  ' + v8 + ' = trunc i32 ' + v + ' to ' + p.itype);
          ir.push('  store ' + p.itype + ' ' + v8 + ', ' + p.itype + '* ' + p.istack);
        }
      } else {
        throw new Error("Read cannot read values of type " + t.name);
      }
    }
    if (isReadLn) {
      ir.push('  call void @_pascal_skip_line(i8* ' + fp + ', i32 ' + line + ')');
    }
    ir.push('  ; READ finish');
    return ir;
  }

  function READLN(ast, cparams) {
    return READ(ast, cparams, true);
  }

  // Write a single value (with optional width/decimals) to stdout or a file
  function write_value(ir, param, fp, toFile) {
    var pre = st.new_name('WRITE'),
      str = '%' + pre + 'str',
      call1 = '%' + pre + 'call1',
      t = param.type,
      itype = param.itype, ilocal = param.ilocal,
      format = null, flen = 3,
      width = param.fmt_width ? as_i32(ir, param.fmt_width) : null,
      decimals = param.fmt_decimals ? as_i32(ir, param.fmt_decimals) : null,
      wformat = null, wlen = 4,
      args;

    switch (t.name) {
      case 'INTEGER':
        switch (t.origname) {
          case 'BOOLEAN':
          case 'ENUMERATION':
            var offset = reg('offset'), arr = reg('arrayidx'), sloc = reg('estr');
            format = '@.str_format';
            wformat = '@.str_wformat';
            ir.push('  ' + offset + ' = zext ' + itype + ' ' + ilocal + ' to i32');
            ir.push('  ' + arr + ' = getelementptr ' + t.enum_type + '* ' + t.enum_var + ', i32 0, i32 ' + offset);
            ir.push('  ' + sloc + ' = load i8** ' + arr);
            itype = 'i8*';
            ilocal = sloc;
            break;
          case 'CHARACTER':
            format = '@.chr_format';
            wformat = '@.chr_wformat';
            break;
          default:
            format = '@.int_format';
            wformat = '@.int_wformat';
            if (itype !== 'i32') {
              var ext = reg('wext');
              ir.push('  ' + ext + ' = zext ' + itype + ' ' + ilocal + ' to i32');
              itype = 'i32';
              ilocal = ext;
            }
            break;
        }
        break;
      case 'STRING':
        format = '@.str_format';
        wformat = '@.str_wformat';
        ilocal = as_cstr(ir, param);
        itype = 'i8*';
        break;
      case 'REAL':
        var conv = reg('wconv');
        ir.push('  ' + conv + ' = fpext float ' + ilocal + ' to double');
        itype = 'double';
        ilocal = conv;
        if (decimals !== null) {
          format = null;
        } else {
          format = '@.float_format';
          flen = 4;
          wformat = '@.float_wformat';
          wlen = 5;
        }
        break;
      default:
        throw new Error("Write cannot print values of type " + (t.name || 'unknown').toLowerCase());
    }

    var target = toFile ? 'i8* ' + fp + ', ' : '';
    var callee = toFile ? 'call i32 (i8*, i8*, ...)* @fprintf' : 'call i32 (i8*, ...)* @printf';
    if (t.name === 'REAL' && decimals !== null) {
      var fixed = reg('ffmt'), w = width === null ? '0' : width;
      ir.push('  ' + fixed + ' = getelementptr inbounds [6 x i8]* @.fixed_wformat, i32 0, i32 0');
      ir.push('  ' + call1 + ' = ' + callee + '(' + target + 'i8* ' + fixed + ', i32 ' + w + ', i32 ' + decimals + ', double ' + ilocal + ')');
      return;
    }
    if (width !== null) {
      ir.push('  ' + str + ' = getelementptr inbounds [' + wlen + ' x i8]* ' + wformat + ', i32 0, i32 0');
      ir.push('  ' + call1 + ' = ' + callee + '(' + target + 'i8* ' + str + ', i32 ' + width + ', ' + itype + ' ' + ilocal + ')');
    } else {
      ir.push('  ' + str + ' = getelementptr inbounds [' + flen + ' x i8]* ' + format + ', i32 0, i32 0');
      ir.push('  ' + call1 + ' = ' + callee + '(' + target + 'i8* ' + str + ', ' + itype + ' ' + ilocal + ')');
    }
  }

  function WRITE(ast, cparams, newline) {
    var ir = [], parts = split_file(cparams), fp = null,
      toFile = !!parts.file;
    ir.push('  ; WRITE start');
    if (toFile) {
      fp = file_handle(ir, parts.file);
    }
    for (var i = 0; i < parts.rest.length; i++) {
      write_value(ir, parts.rest[i], fp, toFile);
    }
    if (newline) {
      var nl = reg('nl'), call = reg('nlcall');
      ir.push('  ' + nl + ' = getelementptr inbounds [2 x i8]* @.newline, i32 0, i32 0');
      if (toFile) {
        ir.push('  ' + call + ' = call i32 (i8*, i8*, ...)* @fprintf(i8* ' + fp + ', i8* ' + nl + ')');
      } else {
        ir.push('  ' + call + ' = call i32 (i8*, ...)* @printf(i8* ' + nl + ')');
      }
    }
    if (!toFile) {
      var sout = reg('sout'), fl = reg('flush');
      ir.push('  ' + sout + ' = load %struct._IO_FILE** @stdout');
      ir.push('  ' + fl + ' = call i32 @fflush(%struct._IO_FILE* ' + sout + ')');
    }
    ir.push('  ; WRITE finish');
    return ir;
  }

  function WRITELN(ast, cparams) {
    return WRITE(ast, cparams, true);
  }

  //
  // Text files
  //

  function need_file(cparams, id, count) {
    if (cparams.length !== count || !is_text(cparams[0])) {
      throw new Error(id + " expects a Text file variable" + (count > 1 ? " and " + (count - 1) + " more argument(s)" : ""));
    }
  }

  function ASSIGN(ast, cparams) {
    var ir = [];
    need_file(cparams, 'Assign', 2);
    ir.push('  ; ASSIGN FILE');
    var name = as_cstr(ir, cparams[1]);
    // keep our own copy so that later changes to the string do not matter
    var dup = reg('fname'), len = reg('flen'), len1 = reg('flen1'), r = reg('fcopy');
    ir.push('  ' + len + ' = call i32 @strlen(i8* ' + name + ')');
    ir.push('  ' + len1 + ' = add i32 ' + len + ', 1');
    ir.push('  ' + dup + ' = call i8* @malloc(i32 ' + len1 + ')');
    ir.push('  ' + r + ' = call i8* @strncpy(i8* ' + dup + ', i8* ' + name + ', i32 ' + len1 + ')');
    ir.push('  call void @_pascal_file_assign(%TEXT* ' + cparams[0].istack + ', i8* ' + dup + ')');
    return ir;
  }

  function file_open(mode, id) {
    return function (ast, cparams) {
      var ir = [];
      need_file(cparams, id, 1);
      ir.push('  call void @_pascal_file_open(%TEXT* ' + cparams[0].istack + ', i32 ' + mode + ', i32 ' + curLine() + ')');
      return ir;
    };
  }

  function CLOSE(ast, cparams) {
    var ir = [];
    need_file(cparams, 'Close', 1);
    ir.push('  call void @_pascal_file_close(%TEXT* ' + cparams[0].istack + ')');
    return ir;
  }

  function file_test(fn, id) {
    return function (ast, cparams) {
      var ir = [], parts = split_file(cparams), res = reg(id.toLowerCase());
      if (cparams.length > 1 || (cparams.length === 1 && !parts.file)) {
        throw new Error(id + " takes an optional Text file argument");
      }
      var fp = parts.file ? file_handle(ir, parts.file) : 'null';
      ir.push('  ' + res + ' = call i1 @' + fn + '(i8* ' + fp + ')');
      ast.type = { node: 'type', name: 'INTEGER', origname: 'BOOLEAN' };
      ast.itype = 'i1';
      ast.ilocal = res;
      return ir;
    };
  }

  //
  // Arithmetic routines
  //

  function one_arg(cparams, id) {
    if (cparams.length !== 1) {
      throw new Error(id + " takes exactly one argument (" + cparams.length + " given)");
    }
    return cparams[0];
  }

  function ABS(ast, cparams) {
    var ir = [], p = one_arg(cparams, 'Abs'), neg = reg('neg'), negv = reg('negv'), r = reg('abs');
    if (p.type.name === 'REAL') {
      ir.push('  ' + neg + ' = fcmp olt float ' + p.ilocal + ', 0x0000000000000000');
      ir.push('  ' + negv + ' = fsub float 0x0000000000000000, ' + p.ilocal);
      ir.push('  ' + r + ' = select i1 ' + neg + ', float ' + negv + ', float ' + p.ilocal);
      ast.type = { node: 'type', name: 'REAL' };
      ast.itype = 'float';
    } else if (is_ordinal(p.type) && !p.type.ids) {
      var v = as_i32(ir, p);
      ir.push('  ' + neg + ' = icmp slt i32 ' + v + ', 0');
      ir.push('  ' + negv + ' = sub i32 0, ' + v);
      ir.push('  ' + r + ' = select i1 ' + neg + ', i32 ' + negv + ', i32 ' + v);
      ast.type = { node: 'type', name: 'INTEGER' };
      ast.itype = 'i32';
    } else {
      throw new Error("Abs needs an integer or real argument");
    }
    ast.ilocal = r;
    return ir;
  }

  function SQR(ast, cparams) {
    var ir = [], p = one_arg(cparams, 'Sqr'), r = reg('sqr');
    if (p.type.name === 'REAL') {
      ir.push('  ' + r + ' = fmul float ' + p.ilocal + ', ' + p.ilocal);
      ast.type = { node: 'type', name: 'REAL' };
      ast.itype = 'float';
    } else if (is_ordinal(p.type) && !p.type.ids) {
      var v = as_i32(ir, p);
      ir.push('  ' + r + ' = mul i32 ' + v + ', ' + v);
      ast.type = { node: 'type', name: 'INTEGER' };
      ast.itype = 'i32';
    } else {
      throw new Error("Sqr needs an integer or real argument");
    }
    ast.ilocal = r;
    return ir;
  }

  function SQRT(ast, cparams) {
    var ir = [], p = one_arg(cparams, 'Sqrt'), f = as_float(ir, p),
      neg = reg('neg'), d = reg('d'), s = reg('s'), r = reg('sqrt');
    declare(ir, 'declare double @sqrt(double)');
    ir.push('  ' + neg + ' = fcmp olt float ' + f + ', 0x0000000000000000');
    var base = st.new_name('sqrtchk'), bad = base + '_bad', ok = base + '_ok';
    ir.push('  br i1 ' + neg + ', label %' + bad + ', label %' + ok);
    ir.push(bad + ':');
    ir.push('  call void @_pascal_trap(i32 207, i32 ' + curLine() + ')');
    ir.push('  unreachable');
    ir.push(ok + ':');
    ir.push('  ' + d + ' = fpext float ' + f + ' to double');
    ir.push('  ' + s + ' = call double @sqrt(double ' + d + ')');
    ir.push('  ' + r + ' = fptrunc double ' + s + ' to float');
    ast.type = { node: 'type', name: 'REAL' };
    ast.itype = 'float';
    ast.ilocal = r;
    return ir;
  }

  function ROUND(ast, cparams) {
    var ir = [], p = one_arg(cparams, 'Round'), r = reg('round');
    if (p.type.name === 'REAL') {
      var neg = reg('neg'), half = reg('half'), sum = reg('sum');
      ir.push('  ' + neg + ' = fcmp olt float ' + p.ilocal + ', 0x0000000000000000');
      ir.push('  ' + half + ' = select i1 ' + neg + ', float 0xBFE0000000000000, float 0x3FE0000000000000');
      ir.push('  ' + sum + ' = fadd float ' + p.ilocal + ', ' + half);
      ir.push('  ' + r + ' = fptosi float ' + sum + ' to i32');
    } else {
      ir.push('  ' + r + ' = add i32 ' + as_i32(ir, p) + ', 0');
    }
    ast.type = { node: 'type', name: 'INTEGER' };
    ast.itype = 'i32';
    ast.ilocal = r;
    return ir;
  }

  function TRUNC(ast, cparams) {
    var ir = [], p = one_arg(cparams, 'Trunc'), r = reg('trunc');
    if (p.type.name === 'REAL') {
      ir.push('  ' + r + ' = fptosi float ' + p.ilocal + ' to i32');
    } else {
      ir.push('  ' + r + ' = add i32 ' + as_i32(ir, p) + ', 0');
    }
    ast.type = { node: 'type', name: 'INTEGER' };
    ast.itype = 'i32';
    ast.ilocal = r;
    return ir;
  }

  function ODD(ast, cparams) {
    var ir = [], p = one_arg(cparams, 'Odd'), bit = reg('bit'), r = reg('odd');
    ir.push('  ' + bit + ' = and i32 ' + as_i32(ir, p) + ', 1');
    ir.push('  ' + r + ' = icmp eq i32 ' + bit + ', 1');
    ast.type = { node: 'type', name: 'INTEGER', origname: 'BOOLEAN' };
    ast.itype = 'i1';
    ast.ilocal = r;
    return ir;
  }

  // Inc/Dec(x [, n]) on ordinal variables
  function step(sign, id) {
    return function (ast, cparams) {
      var ir = [];
      if (cparams.length < 1 || cparams.length > 2) {
        throw new Error(id + " takes a variable and an optional step");
      }
      var v = cparams[0];
      if (!v.istack || !is_ordinal(v.type)) {
        throw new Error(id + " needs an ordinal variable");
      }
      var n = cparams.length === 2 ? as_i32(ir, cparams[1]) : '1',
        cur = reg('cur'), cur32 = reg('cur32'), nxt = reg('nxt'), out = reg('out');
      ir.push('  ' + cur + ' = load ' + v.itype + '* ' + v.istack);
      if (v.itype === 'i32') {
        ir.push('  ' + nxt + ' = ' + (sign > 0 ? 'add' : 'sub') + ' i32 ' + cur + ', ' + n);
        ir.push('  store i32 ' + nxt + ', i32* ' + v.istack);
      } else {
        ir.push('  ' + cur32 + ' = zext ' + v.itype + ' ' + cur + ' to i32');
        ir.push('  ' + nxt + ' = ' + (sign > 0 ? 'add' : 'sub') + ' i32 ' + cur32 + ', ' + n);
        ir.push('  ' + out + ' = trunc i32 ' + nxt + ' to ' + v.itype);
        ir.push('  store ' + v.itype + ' ' + out + ', ' + v.itype + '* ' + v.istack);
      }
      return ir;
    };
  }

  function succ_pred(delta, id) {
    return function (ast, cparams) {
      var ir = [], p = one_arg(cparams, id), r = reg(id.toLowerCase());
      if (!is_ordinal(p.type)) {
        throw new Error(id + " needs an ordinal argument");
      }
      ir.push('  ' + r + ' = add ' + p.itype + ' ' + p.ilocal + ', ' + delta);
      ast.type = p.type;
      ast.itype = p.itype;
      ast.ilocal = r;
      return ir;
    };
  }

  //
  // Transfer functions
  //

  function CHR(ast, cparams) {
    var ir = [], p = one_arg(cparams, 'Chr'), r = reg('char');
    ir.push('  ' + r + ' = trunc i32 ' + as_i32(ir, p) + ' to i8');
    ast.type = { node: 'type', name: 'INTEGER', origname: 'CHARACTER' };
    ast.itype = 'i8';
    ast.ilocal = r;
    return ir;
  }

  function ORD(ast, cparams) {
    var ir = [], p = one_arg(cparams, 'Ord'), r = reg('ord'), t = p.type;
    if (t.name === 'INTEGER') {
      if (p.itype === 'i32') {
        r = p.ilocal;
      } else {
        ir.push('  ' + r + ' = zext ' + p.itype + ' ' + p.ilocal + ' to i32');
      }
    } else if (t.name === 'STRING' && p.val !== undefined && p.val.length === 1) {
      var chr = reg('ordc');
      ir.push('  ' + chr + ' = getelementptr inbounds ' + p.itype + ' ' + p.istack + ', i32 0, i32 0');
      var b = reg('ordb');
      ir.push('  ' + b + ' = load i8* ' + chr);
      ir.push('  ' + r + ' = zext i8 ' + b + ' to i32');
    } else {
      throw new Error("Ord needs an ordinal argument");
    }
    ast.type = { node: 'type', name: 'INTEGER' };
    ast.itype = 'i32';
    ast.ilocal = r;
    return ir;
  }

  function INTEGER(ast, cparams) {
    var ir = [], p = one_arg(cparams, 'Integer'), r;
    if (p.type.name === 'REAL') {
      r = reg('int');
      ir.push('  ' + r + ' = fptosi float ' + p.ilocal + ' to i32');
    } else {
      r = as_i32(ir, p);
    }
    ast.type = { node: 'type', name: 'INTEGER' };
    ast.itype = 'i32';
    ast.ilocal = r;
    return ir;
  }

  function UPCASE(ast, cparams) {
    var ir = [], p = one_arg(cparams, 'UpCase'), wide = reg('w'), up = reg('up'), r = reg('upc');
    if (p.type.origname !== 'CHARACTER') {
      throw new Error("UpCase needs a character argument");
    }
    ir.push('  ' + wide + ' = zext i8 ' + p.ilocal + ' to i32');
    ir.push('  ' + up + ' = call i32 @toupper(i32 ' + wide + ')');
    ir.push('  ' + r + ' = trunc i32 ' + up + ' to i8');
    ast.type = { node: 'type', name: 'INTEGER', origname: 'CHARACTER' };
    ast.itype = 'i8';
    ast.ilocal = r;
    return ir;
  }

  //
  // String routines
  //

  function LENGTH(ast, cparams) {
    var ir = [], p = one_arg(cparams, 'Length'), s = as_cstr(ir, p), l = reg('len'), r = reg('len32');
    ir.push('  ' + r + ' = call i32 @strlen(i8* ' + s + ')');
    void l;
    ast.type = { node: 'type', name: 'INTEGER' };
    ast.itype = 'i32';
    ast.ilocal = r;
    return ir;
  }

  function COPY(ast, cparams) {
    var ir = [];
    if (cparams.length !== 3) {
      throw new Error("Copy takes a string, a start position and a count");
    }
    var s = as_cstr(ir, cparams[0]), r = reg('copy');
    ir.push('  ' + r + ' = call i8* @_pascal_copy(i8* ' + s + ', i32 ' + as_i32(ir, cparams[1]) + ', i32 ' + as_i32(ir, cparams[2]) + ')');
    ast.type = { node: 'type', name: 'STRING' };
    ast.itype = 'i8*';
    ast.ilocal = r;
    return ir;
  }

  function POS(ast, cparams) {
    var ir = [];
    if (cparams.length !== 2) {
      throw new Error("Pos takes the text to look for and the string to search in");
    }
    var sub = as_cstr(ir, cparams[0]), str = as_cstr(ir, cparams[1]), r = reg('pos');
    ir.push('  ' + r + ' = call i32 @_pascal_pos(i8* ' + sub + ', i8* ' + str + ')');
    ast.type = { node: 'type', name: 'INTEGER' };
    ast.itype = 'i32';
    ast.ilocal = r;
    return ir;
  }

  function CONCAT(ast, cparams) {
    var ir = [], ir_after = [],
      clen = cparams.length,
      lname = st.new_name('%concat'),
      prev_tsize = st.new_name('%tsize'),
      new_tsize = st.new_name('%new_tsize');
    if (clen < 2) {
      throw new Error("Concat requires at least two arguments (" + clen + " given)");
    }
    declare(ir, 'declare i8* @strncat(i8*, i8*, i32)');
    ir.push('  ; CONCAT start');
    ir.push('  ' + prev_tsize + ' = add i32 0, 0');
    for (var i = 0; i < cparams.length; i++) {
      var cparam = cparams[i];
      if (cparam.type.name !== 'STRING' && cparam.type.origname !== 'CHARACTER') {
        throw new Error("Concat arguments must be strings or characters");
      }
      var s = as_cstr(ir, cparam),
        size = st.new_name('%size'),
        tsize = st.new_name('%tsize'),
        ret = st.new_name('%ret');
      ir.push('  ' + size + ' = call i32 @strlen(i8* ' + s + ')');
      ir.push('  ' + tsize + ' = add i32 ' + size + ', ' + prev_tsize);
      ir_after.push('  ' + ret + ' = call i8* @strncat(i8* ' + lname + ', i8* ' + s + ', i32 ' + size + ')');
      prev_tsize = tsize;
    }
    ir.push('  ' + new_tsize + ' = add i32 ' + prev_tsize + ', 1');
    ir.push('  ' + lname + ' = call i8* @malloc(i32 ' + new_tsize + ')');
    ir.push('  store i8 0, i8* ' + lname);
    ir.push.apply(ir, ir_after);
    ir.push('  ; CONCAT finish');
    ast.type = { node: 'type', name: 'STRING' };
    ast.itype = 'i8*';
    ast.ilocal = lname;
    return ir;
  }

  //
  // Heap routines
  //

  function pointer_var(cparams, id) {
    if (cparams.length !== 1 || !cparams[0].istack || cparams[0].type.name !== 'POINTER') {
      throw new Error(id + " needs a pointer variable");
    }
    return cparams[0];
  }

  function NEW(ast, cparams) {
    var ir = [], p = pointer_var(cparams, 'New'),
      szp = reg('szp'), sz = reg('sz'), raw = reg('raw'), typed = reg('typed');
    ir.push('  ; NEW');
    ir.push('  ' + szp + ' = getelementptr ' + p.itype + ' null, i32 1');
    ir.push('  ' + sz + ' = ptrtoint ' + p.itype + ' ' + szp + ' to i32');
    ir.push('  ' + raw + ' = call i8* @malloc(i32 ' + sz + ')');
    ir.push('  call void @memset(i8* ' + raw + ', i8 0, i32 ' + sz + ')');
    ir.push('  ' + typed + ' = bitcast i8* ' + raw + ' to ' + p.itype);
    ir.push('  store ' + p.itype + ' ' + typed + ', ' + p.itype + '* ' + p.istack);
    return ir;
  }

  function DISPOSE(ast, cparams) {
    var ir = [], p = pointer_var(cparams, 'Dispose'),
      cur = reg('cur'), raw = reg('raw');
    declare(ir, 'declare void @free(i8*)');
    ir.push('  ; DISPOSE');
    ir.push('  ' + cur + ' = load ' + p.itype + '* ' + p.istack);
    ir.push('  ' + raw + ' = bitcast ' + p.itype + ' ' + cur + ' to i8*');
    ir.push('  call void @free(i8* ' + raw + ')');
    ir.push('  store ' + p.itype + ' null, ' + p.itype + '* ' + p.istack);
    return ir;
  }

  //
  // Set routines
  //

  function set_update(fn, id) {
    return function (ast, cparams) {
      var ir = [];
      if (cparams.length !== 2 || !cparams[0].istack || cparams[0].type.name !== 'SET') {
        throw new Error(id + " needs a set variable and an element");
      }
      if (!is_ordinal(cparams[1].type)) {
        throw new Error(id + ": the element must be an ordinal value");
      }
      ir.push('  call void @' + fn + '([32 x i8]* ' + cparams[0].istack + ', i32 ' + as_i32(ir, cparams[1]) + ', i32 ' + curLine() + ')');
      return ir;
    };
  }

  //
  // Miscellaneous routines
  //

  function HALT(ast, cparams) {
    var ir = [], code = cparams.length === 0 ? '0' : as_i32(ir, cparams[0]);
    ir.push('  ; HALT start');
    ir.push('  call void @exit(i32 ' + code + ') noreturn nounwind');
    ir.push('  unreachable');
    ir.push('  ; HALT finish');
    return ir;
  }

  function RANDOM(ast, cparams) {
    var ir = [], clen = cparams.length,
      call = reg('rnd');
    ir.push('  ; RANDOM start');
    ir.push('  ' + call + ' = call double @drand48()');
    if (clen === 0) {
      // a random Real 0 <= x < 1
      var conv = reg('rndf');
      ir.push('  ' + conv + ' = fptrunc double ' + call + ' to float');
      ast.type = { node: 'type', name: 'REAL' };
      ast.itype = 'float';
      ast.ilocal = conv;
    } else if (clen === 1) {
      // a random Integer 0 <= x < n
      var n = as_i32(ir, cparams[0]), nf = reg('rndn'), scaled = reg('rnds'), res = reg('rndi');
      ir.push('  ' + nf + ' = sitofp i32 ' + n + ' to double');
      ir.push('  ' + scaled + ' = fmul double ' + call + ', ' + nf);
      ir.push('  ' + res + ' = fptosi double ' + scaled + ' to i32');
      ast.type = { node: 'type', name: 'INTEGER', origname: 'INTEGER' };
      ast.itype = 'i32';
      ast.ilocal = res;
    } else {
      throw new Error("Random only accepts one or zero arguments (" + clen + " given)");
    }
    ir.push('  ; RANDOM finish');
    return ir;
  }

  function RANDOMIZE() {
    return [];
  }

  // Symbol table initialization
  var settings = st.lookup('_settings_');

  function pins(nm, efn, fps, rtyp) {
    st.unit_pinsert(nm, efn, fps, rtyp);
  }

  var VARARGS = [{ type: { node: 'type', name: 'varargs' }, var: true }];
  var VALUES = [{ type: { node: 'type', name: 'varargs' } }];
  var ANY1 = [{ type: { node: 'type', name: 'any' } }];

  // I/O routines
  pins('READ', function (a, c) { return READ(a, c, false); }, VARARGS);
  pins('READLN', READLN, VARARGS);
  pins('WRITE', function (a, c) { return WRITE(a, c, false); }, VALUES);
  pins('WRITELN', WRITELN, VALUES);
  pins('ASSIGN', ASSIGN, [{ type: { node: 'type', name: 'any' } }, { type: { node: 'type', name: 'any' } }]);
  pins('RESET', file_open(0, 'Reset'), ANY1);
  pins('REWRITE', file_open(1, 'Rewrite'), ANY1);
  pins('APPEND', file_open(2, 'Append'), ANY1);
  pins('CLOSE', CLOSE, ANY1);
  pins('EOF', file_test('_pascal_eof', 'Eof'), VALUES, { node: 'type', name: 'BOOLEAN' });
  pins('EOLN', file_test('_pascal_eoln', 'Eoln'), VALUES, { node: 'type', name: 'BOOLEAN' });
  // Arithmetic and scalar routines
  pins('ABS', ABS, ANY1, { node: 'type', name: 'any' });
  pins('SQR', SQR, ANY1, { node: 'type', name: 'any' });
  pins('SQRT', SQRT, ANY1, { node: 'type', name: 'REAL' });
  pins('ROUND', ROUND, ANY1, { node: 'type', name: 'INTEGER' });
  pins('TRUNC', TRUNC, ANY1, { node: 'type', name: 'INTEGER' });
  pins('ODD', ODD, ANY1, { node: 'type', name: 'BOOLEAN' });
  pins('INC', step(1, 'Inc'), VALUES);
  pins('DEC', step(-1, 'Dec'), VALUES);
  pins('SUCC', succ_pred(1, 'Succ'), ANY1, { node: 'type', name: 'any' });
  pins('PRED', succ_pred(-1, 'Pred'), ANY1, { node: 'type', name: 'any' });
  // Transfer functions
  pins('CHAR', CHR, ANY1, { node: 'type', name: 'CHARACTER' });
  pins('CHR', CHR, ANY1, { node: 'type', name: 'CHARACTER' });
  pins('ORD', ORD, ANY1, { node: 'type', name: 'INTEGER' });
  pins('INTEGER', INTEGER, ANY1, { node: 'type', name: 'INTEGER' });
  pins('UPCASE', UPCASE, ANY1, { node: 'type', name: 'CHARACTER' });
  // String routines
  pins('LENGTH', LENGTH, ANY1, { node: 'type', name: 'INTEGER' });
  pins('COPY', COPY, VALUES, { node: 'type', name: 'STRING' });
  pins('POS', POS, VALUES, { node: 'type', name: 'INTEGER' });
  pins('CONCAT', CONCAT, VALUES, { node: 'type', name: 'STRING' });
  // Heap and sets
  pins('NEW', NEW, ANY1);
  pins('DISPOSE', DISPOSE, ANY1);
  pins('INCLUDE', set_update('_pascal_set_add', 'Include'), VALUES);
  pins('EXCLUDE', set_update('_pascal_set_remove', 'Exclude'), VALUES);
  // Miscellaneous
  pins('HALT', HALT, VALUES);
  pins('RANDOM', RANDOM, VALUES, { node: 'type', name: 'any' });
  pins('RANDOMIZE', RANDOMIZE, VALUES);

  void settings;
  return { init: init, stop: stop };
};

if (typeof module !== 'undefined') {
  exports.SYSTEM = SYSTEM;
}
