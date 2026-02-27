#!/usr/bin/env python3
"""
Debug script to capture browser console logs and errors
when clicking the Run button in the Pascal tutorial app.
"""

from playwright.sync_api import sync_playwright
import json

url = 'http://localhost:5173'
console_logs = []
page_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # Set up console log capture
    def handle_console_message(msg):
        log_entry = f"[{msg.type}] {msg.text}"
        console_logs.append(log_entry)
        print(f"Console: {log_entry}")

    page.on("console", handle_console_message)

    # Set up page error capture
    def handle_page_error(error):
        error_entry = f"PageError: {error}"
        page_errors.append(error_entry)
        print(f"Page Error: {error}")

    page.on("pageerror", handle_page_error)

    # Navigate to home page first
    print("\n=== Navigating to home page ===")
    page.goto(url)
    page.wait_for_load_state('networkidle')

    # Take screenshot of home page
    page.screenshot(path='/tmp/home_page.png')
    print("Screenshot saved to /tmp/home_page.png")

    # Find and click on a tutorial link (look for level links)
    print("\n=== Looking for tutorial links ===")
    
    # Get all links on the page
    links = page.locator('a').all()
    print(f"Found {len(links)} links on the page")
    
    for i, link in enumerate(links):
        try:
            href = link.get_attribute('href')
            text = link.inner_text()
            print(f"  Link {i}: href='{href}' text='{text}'")
        except Exception as e:
            print(f"  Link {i}: Error getting attributes - {e}")

    # Navigate directly to a tutorial page
    print("\n=== Navigating to tutorial page ===")
    page.goto(f"{url}/tutorial/1")
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)  # Wait for code editor to load

    # Take screenshot of tutorial page
    page.screenshot(path='/tmp/tutorial_page.png')
    print("Screenshot saved to /tmp/tutorial_page.png")

    # Find the Run button (Ausführen)
    print("\n=== Looking for Run button ===")
    buttons = page.locator('button').all()
    print(f"Found {len(buttons)} buttons on the page")
    
    for i, button in enumerate(buttons):
        try:
            text = button.inner_text()
            disabled = button.is_disabled()
            print(f"  Button {i}: text='{text}' disabled={disabled}")
        except Exception as e:
            print(f"  Button {i}: Error getting attributes - {e}")

    # Click the Run button
    print("\n=== Clicking Run button ===")
    try:
        # Try to find button by German text
        run_button = page.locator('button:has-text("Ausführen")')
        if run_button.count() > 0:
            print("Found 'Ausführen' button, clicking...")
            run_button.first.click()
        else:
            # Try English text
            run_button = page.locator('button:has-text("Run")')
            if run_button.count() > 0:
                print("Found 'Run' button, clicking...")
                run_button.first.click()
            else:
                print("Could not find Run button, trying to find any button with run-related text")
                # Look for any button that might be the run button
                for button in buttons:
                    text = button.inner_text().lower()
                    if 'run' in text or 'exec' in text or 'aus' in text:
                        print(f"Clicking button with text: {button.inner_text()}")
                        button.click()
                        break
    except Exception as e:
        print(f"Error clicking Run button: {e}")

    # Wait for execution to complete
    page.wait_for_timeout(3000)

    # Take screenshot after clicking
    page.screenshot(path='/tmp/after_run.png')
    print("Screenshot saved to /tmp/after_run.png")

    # Check if error page is shown
    page_content = page.content()
    if "Something went wrong" in page_content:
        print("\n!!! ERROR PAGE DETECTED !!!")
        print("The ErrorBoundary caught an error")

    # Get the current page URL
    print(f"\nCurrent URL: {page.url}")

    browser.close()

# Print summary
print("\n" + "="*50)
print("SUMMARY")
print("="*50)
print(f"\nConsole logs captured: {len(console_logs)}")
for log in console_logs:
    print(f"  {log}")

print(f"\nPage errors captured: {len(page_errors)}")
for error in page_errors:
    print(f"  {error}")

# Save logs to file
with open('/tmp/debug_console.log', 'w') as f:
    f.write("Console Logs:\n")
    f.write('\n'.join(console_logs))
    f.write("\n\nPage Errors:\n")
    f.write('\n'.join(page_errors))

print("\nLogs saved to /tmp/debug_console.log")
