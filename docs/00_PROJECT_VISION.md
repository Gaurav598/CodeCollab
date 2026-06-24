# 00 — Project Vision

## Project Name
**CollabCode**

## Tagline
AI-Powered Developer Collaboration Platform

## Mission
Provide an enterprise-grade real-time collaborative coding environment with AI assistance, conflict-free synchronization, secure execution sandboxes, live communication, and scalable distributed architecture.

## Target Users
- Developers
- Students
- Technical interviewers / interviewees
- Remote teams
- Open source contributors

## Primary Goal
Enable multiple developers to collaborate on code in real time with low latency (sub-50ms target for sync events) while maintaining consistency across a distributed backend.

## Where this came from
This is a ground-up rebuild of an existing project ("Coding Collaborator" / CodeFuse) that already works but has critical security holes, a naive sync model, and a basic UI. Every flaw in the old version is a requirement in this rebuild — see `18_SECURITY.md` and `01_PRODUCT_REQUIREMENTS.md` for the full list of what's being fixed, not just added.

## What "done" looks like
- Two or more users can co-edit the same file with zero lost keystrokes, even on simultaneous edits.
- Code execution happens in an isolated, resource-capped, auto-destroyed sandbox.
- No secret/API key ever reaches the frontend bundle.
- Every protected action requires a verified identity — no client-supplied identity is ever trusted blindly.
- The product looks and feels like a serious, professionally designed tool — not a student project — particularly on the landing/login screen and the main editor workspace.
