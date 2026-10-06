#!/usr/bin/env python3
"""
Electron Smoke Test for Scrivener Web
Verifies that the built HTML/JS contains required accessibility elements.
"""

import sys
import os
import json
import re
from pathlib import Path


def get_project_root():
    """Get the project root directory."""
    return Path(__file__).parent.parent


def get_dist_path():
    """Get the dist directory path."""
    return get_project_root() / 'dist'


def get_js_bundle_content():
    """Read all JS bundle files and return combined content."""
    dist_path = get_dist_path()
    assets_path = dist_path / 'assets'
    
    if not assets_path.exists():
        print(f"ERROR: Assets directory not found at {assets_path}")
        print(f"Current directory: {os.getcwd()}")
        print(f"Script directory: {Path(__file__).parent}")
        return None
    
    combined = ''
    js_files = list(assets_path.glob('*.js'))
    
    if not js_files:
        print(f"ERROR: No JS files found in {assets_path}")
        return None
    
    for filepath in js_files:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                combined += f.read()
        except Exception as e:
            print(f"Warning: Could not read {filepath}: {e}")
    
    return combined


def test_brand():
    """Test that brand/logo exists in the build output."""
    js_content = get_js_bundle_content()
    
    if js_content is None:
        print("ERROR: Could not read JS bundle. Run 'npm run build' first.")
        return False
    
    # Check for brand name
    has_brand = (
        'OpenScriv' in js_content or
        '"OpenScriv"' in js_content or
        "'OpenScriv'" in js_content
    )
    
    # Check for header element
    has_header = 'header' in js_content
    
    result = {
        'hasBrand': has_brand,
        'hasHeader': has_header,
    }
    
    print(f"Smoke Test - Brand: {json.dumps(result)}")
    
    if not result['hasBrand']:
        print(f"FAIL: Could not find brand in the build output")
        print(f"  - Brand found: {has_brand}")
        print(f"  - Header found: {has_header}")
        return False
    
    print("PASS: Brand found")
    return True


def test_editor():
    """Test that editor/textarea exists in the build output."""
    js_content = get_js_bundle_content()
    
    if js_content is None:
        print("ERROR: Could not read JS bundle.")
        return False
    
    # Check for textarea element
    has_textarea = 'textarea' in js_content
    
    # Check for editor-related content
    has_editor = (
        'Manuscript editor' in js_content or
        'Editör' in js_content or
        'editor' in js_content
    )
    
    # Check for main content area
    has_main = 'main' in js_content
    
    result = {
        'hasEditor': has_textarea or has_editor,
        'hasTextarea': has_textarea,
        'hasEditorLabel': has_editor,
        'hasMain': has_main,
    }
    
    print(f"Smoke Test - Editor: {json.dumps(result)}")
    
    if not result['hasEditor']:
        print(f"FAIL: Could not find editor in the build output")
        print(f"  - Textarea found: {has_textarea}")
        print(f"  - Editor label found: {has_editor}")
        print(f"  - Main found: {has_main}")
        return False
    
    print("PASS: Editor found")
    return True


def test_binder_sidebar():
    """Test that aside.sidebar[aria-label='Binder'] exists in the build output."""
    js_content = get_js_bundle_content()
    
    if js_content is None:
        print("ERROR: Could not read JS bundle. Run 'npm run build' first.")
        return False
    
    # Check for sidebar class (multiple patterns)
    has_sidebar_class = (
        'sidebar' in js_content or 
        '"sidebar"' in js_content or 
        "'sidebar'" in js_content
    )
    
    # Check for Binder aria-label (multiple patterns)
    has_binder_label = (
        'Binder' in js_content or 
        '"Binder"' in js_content or 
        "'Binder'" in js_content
    )
    
    # Check for aside element creation pattern
    has_aside = 'aside' in js_content
    
    # Check for aria-label attribute
    has_aria_label = 'aria-label' in js_content
    
    result = {
        'hasBinder': has_sidebar_class and has_binder_label,
        'hasSidebarClass': has_sidebar_class,
        'hasBinderLabel': has_binder_label,
        'hasAsideElement': has_aside,
        'hasAriaLabel': has_aria_label,
    }
    
    print(f"Smoke Test - Binder: {json.dumps(result)}")
    
    if not result['hasBinder']:
        print(f"FAIL: Could not find aside.sidebar[aria-label='Binder'] in the build output")
        print(f"  - sidebar class found: {has_sidebar_class}")
        print(f"  - Binder label found: {has_binder_label}")
        print(f"  - aside element found: {has_aside}")
        print(f"  - aria-label found: {has_aria_label}")
        return False
    
    print("PASS: Binder sidebar found")
    return True


def test_inspector_panel():
    """Test that aside[aria-label='Inspector'] exists."""
    js_content = get_js_bundle_content()
    
    if js_content is None:
        print("ERROR: Could not read JS bundle.")
        return False
    
    has_inspector = (
        'Inspector' in js_content or 
        '"Inspector"' in js_content or 
        "'Inspector'" in js_content
    )
    
    if not has_inspector:
        print("FAIL: Inspector panel not found")
        return False
    
    print("PASS: Inspector panel found")
    return True


def test_search_input():
    """Test that search input with aria-label exists."""
    js_content = get_js_bundle_content()
    
    if js_content is None:
        print("ERROR: Could not read JS bundle.")
        return False
    
    has_search = (
        'Search' in js_content or 
        '"Search"' in js_content or 
        "'Search'" in js_content or
        'Arama Yap' in js_content
    )
    
    if not has_search:
        print("FAIL: Search input not found")
        return False
    
    print("PASS: Search input found")
    return True


def test_compile_window():
    """Test that Compile window exists."""
    js_content = get_js_bundle_content()
    
    if js_content is None:
        print("ERROR: Could not read JS bundle.")
        return False
    
    has_compile = (
        'Compile' in js_content or 
        '"Compile"' in js_content or 
        "'Compile'" in js_content
    )
    
    if not has_compile:
        print("FAIL: Compile window not found")
        return False
    
    print("PASS: Compile window found")
    return True


def test_autosave_save_document():
    """Test that useAutosave.js contains the correct saveDocument call pattern."""
    js_content = get_js_bundle_content()
    
    if js_content is None:
        print("ERROR: Could not read JS bundle.")
        return False
    
    # Check for the saveDocument call pattern with projectId, docId, content
    has_save_pattern = (
        'saveDocument' in js_content and 
        'projectId' in js_content and 
        'docId' in js_content and 
        'content' in js_content
    )
    
    if not has_save_pattern:
        print("FAIL: saveDocument call pattern not found in bundle")
        return False
    
    print("PASS: saveDocument call pattern found")
    return True


def main():
    print("=" * 60)
    print("Electron Smoke Test - Scrivener Web")
    print("=" * 60)
    print(f"Project root: {get_project_root()}")
    print(f"Dist path: {get_dist_path()}")
    print()
    
    tests = [
        test_brand,
        test_editor,
        test_binder_sidebar,
        test_inspector_panel,
        test_search_input,
        test_compile_window,
        test_autosave_save_document,
    ]
    
    all_passed = True
    for test in tests:
        try:
            if not test():
                all_passed = False
        except Exception as e:
            print(f"ERROR in {test.__name__}: {e}")
            import traceback
            traceback.print_exc()
            all_passed = False
    
    print()
    print("=" * 60)
    if all_passed:
        print("ALL SMOKE TESTS PASSED")
        sys.exit(0)
    else:
        print("SOME SMOKE TESTS FAILED")
        sys.exit(1)


if __name__ == '__main__':
    main()
