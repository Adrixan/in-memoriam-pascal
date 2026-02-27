#!/usr/bin/env python3
"""
Test script to debug the "Ausführen" button click issue.
Captures console errors and screenshots before/after clicking.
"""

from playwright.sync_api import sync_playwright
import json
import sys

def main():
    console_messages = []
    errors = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Capture console messages
        def handle_console(msg):
            console_messages.append({
                'type': msg.type,
                'text': msg.text,
                'location': msg.location
            })
            print(f"[CONSOLE {msg.type}] {msg.text}", file=sys.stderr)
        
        # Capture page errors
        def handle_error(error):
            errors.append({
                'message': str(error),
                'stack': getattr(error, 'stack', None)
            })
            print(f"[PAGE ERROR] {error}", file=sys.stderr)
        
        page.on('console', handle_console)
        page.on('pageerror', handle_error)
        
        print("Navigating to http://localhost:5173/tutorial/1...", file=sys.stderr)
        page.goto('http://localhost:5173/tutorial/1')
        
        print("Waiting for network idle...", file=sys.stderr)
        page.wait_for_load_state('networkidle')
        
        # Additional wait for Monaco editor to load
        print("Waiting for Monaco editor...", file=sys.stderr)
        page.wait_for_timeout(3000)
        
        # Take screenshot before clicking
        print("Taking screenshot before click...", file=sys.stderr)
        page.screenshot(path='/tmp/before_click.png', full_page=True)
        
        # Find the Ausführen button
        print("Looking for Ausführen button...", file=sys.stderr)
        buttons = page.locator('button').all()
        print(f"Found {len(buttons)} buttons on page", file=sys.stderr)
        
        for i, btn in enumerate(buttons):
            try:
                text = btn.inner_text()
                print(f"  Button {i}: '{text}'", file=sys.stderr)
            except:
                print(f"  Button {i}: (could not get text)", file=sys.stderr)
        
        # Try to find and click the Ausführen button
        ausfuehren_btn = None
        try:
            ausfuehren_btn = page.get_by_role('button', name='Ausführen')
            if ausfuehren_btn.count() == 0:
                # Try alternative selectors
                ausfuehren_btn = page.locator('button:has-text("Ausführen")')
        except Exception as e:
            print(f"Error finding button: {e}", file=sys.stderr)
        
        if ausfuehren_btn and ausfuehren_btn.count() > 0:
            print("Found Ausführen button, clicking...", file=sys.stderr)
            
            # Click and wait for response
            try:
                ausfuehren_btn.first.click()
                
                # Wait for any response
                page.wait_for_timeout(5000)
                
                # Take screenshot after clicking
                print("Taking screenshot after click...", file=sys.stderr)
                page.screenshot(path='/tmp/after_click.png', full_page=True)
                
                # Check for error page
                page_content = page.content()
                if 'Something went wrong' in page_content:
                    print("ERROR PAGE DETECTED!", file=sys.stderr)
                    
                    # Try to find error details
                    error_element = page.locator('text=/error|Error|ERROR/')
                    if error_element.count() > 0:
                        print(f"Error elements found: {error_element.count()}", file=sys.stderr)
                
                # Check URL
                print(f"Current URL: {page.url}", file=sys.stderr)
                
            except Exception as e:
                print(f"Error clicking button: {e}", file=sys.stderr)
                page.screenshot(path='/tmp/error_state.png', full_page=True)
        else:
            print("Could not find Ausführen button!", file=sys.stderr)
            page.screenshot(path='/tmp/no_button_found.png', full_page=True)
        
        browser.close()
    
    # Output summary
    print("\n=== SUMMARY ===")
    print(f"Console messages: {len(console_messages)}")
    print(f"Page errors: {len(errors)}")
    
    if errors:
        print("\n=== ERRORS ===")
        for err in errors:
            print(json.dumps(err, indent=2))
    
    if console_messages:
        print("\n=== CONSOLE MESSAGES ===")
        for msg in console_messages:
            if msg['type'] in ['error', 'warning']:
                print(json.dumps(msg, indent=2))

if __name__ == '__main__':
    main()
