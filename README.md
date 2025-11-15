# Tailwind CSS Integration Solution

## Problem
The CSS file [hms/static/css/hms.css](file:///d:/Wagtail_Projects/hms/hms/static/css/hms.css) was showing a warning "Unknown at rule @tailwind css(unknownAtRules)" because it contained Tailwind directives that are not valid CSS by themselves.

## Solution
1. Set up a Tailwind CSS build process that processes the source CSS file with Tailwind directives into a valid CSS file
2. Updated the base template to use the generated CSS file instead of the source file
3. Added npm scripts for building and watching CSS changes

## How to Use
- To build the CSS: `npm run build`
- To watch for changes and rebuild automatically: `npm run watch`

The build process generates [hms/static/css/output.css](file:///d:/Wagtail_Projects/hms/hms/static/css/output.css) which is the file actually used by the application.