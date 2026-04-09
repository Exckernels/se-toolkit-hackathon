# Idea Incubator

A web application that transforms raw ideas into structured MVP plans with iterative AI refinement.

---

## Demo

<!-- Add screenshots here -->
<!-- Example: -->
<!-- ![Main Screen](./screenshots/main.png) -->
<!-- ![Generated Plan](./screenshots/plan.png) -->

---

## Product Context

### End Users
- Students
- Early-stage founders
- Hackathon participants

### Problem
Many users struggle to convert raw, vague ideas into clear and structured MVP plans. Existing tools generate outputs but do not support iterative refinement or version tracking.

### Solution
Idea Incubator provides a structured workflow where users:
- input raw ideas
- generate structured MVP plans
- refine them through an AI back-and-forth loop
- track versions of improvements

---

## Features

### Implemented
- Idea creation from raw input
- Structured MVP output:
  - Overview
  - Audience
  - Problem
  - Solution
  - Features
  - MVP Scope
  - Risks
  - Roadmap
- Version history per idea
- AI refinement loop (chat-based iteration)
- Delete idea and delete version
- Export functionality (text / JSON)
- Full-stack architecture (Next.js + FastAPI)
- Dockerized deployment
- VM deployment support

### Not Yet Implemented
- User authentication (user-specific ideas)
- Collaborative editing
- Advanced export (PDF generation)
- Analytics / usage tracking

---

## Usage

1. Open the application
2. Enter:
   - Idea title
   - Description of your idea
3. Click **Generate**
4. Review the structured MVP plan
5. Use refinement:
   - buttons (Simplify, Focus on MVP, etc.)
   - or custom input
6. Each refinement creates a new version
7. Switch between versions in the sidebar
8. Export or copy the result
9. Delete ideas or versions if needed

---

## Deployment

### Target Environment
- OS: **Ubuntu 24.04**
- Recommended:
  - Docker
  - Docker Compose

---

### Requirements

Install Docker:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker