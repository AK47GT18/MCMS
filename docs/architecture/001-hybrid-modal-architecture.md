# ADR-001: Hybrid Modal/Page Architecture

## Date: 2025-12-20

## Status: Accepted

## Context
Modern enterprise applications require balancing speed (modals) with complexity (full pages).
Construction management involves both quick actions (approvals, status updates) and complex 
workflows (project creation, report generation).

## Decision
Implement a hybrid architecture:
- **Modals**: Quick views, approvals, simple forms (< 5 fields)
- **Full Pages**: Complex forms, multi-step workflows, comprehensive views

## Structure
\\\
views/
â”œâ”€â”€ pages/          # Complex workflows (full page loads)
â”‚   â””â”€â”€ projects/
â”‚       â”œâ”€â”€ list.php
â”‚       â”œâ”€â”€ create.php
â”‚       â””â”€â”€ edit.php
â””â”€â”€ modals/         # Quick actions (AJAX loaded)
    â””â”€â”€ projects/
        â”œâ”€â”€ quick-view.php
        â”œâ”€â”€ status-update.php
        â””â”€â”€ assign-team.php
\\\

## API Pattern
\\\
api/v1/
â”œâ”€â”€ projects/           # CRUD operations
â””â”€â”€ modal-data/         # Quick data fetching for modals
\\\

## Benefits
- Faster user experience for common actions
- Proper workflows for complex tasks
- Reduced cognitive load
- Better mobile experience
- Industry-standard UX pattern

## Consequences
- More JavaScript complexity
- Need robust AJAX error handling
- Requires careful state management
- Increased testing surface

