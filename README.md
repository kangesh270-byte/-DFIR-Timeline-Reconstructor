# 🛡️ Interactive DFIR Incident Timeline Reconstructor

<p align="center">

**Transforming Digital Evidence into Actionable Cyber Intelligence**

*A modern Digital Forensics & Incident Response (DFIR) platform for interactive incident timeline reconstruction, evidence correlation, adversary behavior analysis, and automated forensic reporting.*

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase)
![License](https://img.shields.io/badge/License-MIT-green)

</p>

---

# 📖 Project Overview

**Interactive DFIR Incident Timeline Reconstructor** is an advanced Digital Forensics & Incident Response platform that assists investigators in reconstructing cyber incidents from forensic evidence.

The platform enables analysts to upload forensic artifacts, automatically organize events into chronological timelines, correlate evidence, map attacker techniques to the **MITRE ATT&CK Framework**, analyze each attack phase using the **Cyber Kill Chain**, calculate incident severity, and generate professional investigation reports.

Designed for:

* 👨‍💻 Digital Forensic Analysts
* 🔐 SOC Analysts
* 🚨 Incident Responders
* 🎓 Cybersecurity Students
* 🏢 Security Operations Teams

---

# 🚨 Problem Statement

Digital investigations often involve thousands of logs collected from different systems.

Current investigation workflows suffer from:

* Fragmented forensic evidence
* Manual timeline creation
* Poor evidence correlation
* Time-consuming analysis
* Lack of standardized reporting
* Steep learning curve for new investigators

This project provides a unified DFIR platform that streamlines the complete investigation lifecycle.

---

# 🎯 Project Objectives

* Build an interactive DFIR investigation platform
* Reconstruct chronological attack timelines
* Correlate evidence from multiple forensic artifacts
* Map attacker behavior to MITRE ATT&CK techniques
* Analyze attack progression using Cyber Kill Chain
* Generate automated forensic investigation reports
* Improve investigation speed and accuracy

---

# ✨ Key Features

## 📂 Evidence Management

* Upload CSV forensic logs
* Upload JSON artifacts
* Evidence validation
* Metadata extraction

---

## 📅 Interactive Timeline Reconstruction

* Automatic event ordering
* Chronological visualization
* Event filtering
* Interactive timeline exploration

---

## 🎯 MITRE ATT&CK Mapping

* Technique identification
* Tactic classification
* ATT&CK matrix mapping
* Threat behavior visualization

---

## 🔗 Cyber Kill Chain Analysis

* Reconnaissance
* Weaponization
* Delivery
* Exploitation
* Installation
* Command & Control
* Actions on Objectives

---

## 🔍 Evidence Correlation

* Cross-log correlation
* Related event detection
* Investigation linking
* Timeline enrichment

---

## 📊 Incident Scoring

* Risk calculation
* Severity assessment
* Investigation confidence score
* Attack impact evaluation

---

## 📑 Report Generation

Generate professional investigation reports including:

* Executive Summary
* Timeline of Events
* Evidence Details
* MITRE ATT&CK Mapping
* Cyber Kill Chain Analysis
* Risk Assessment
* Recommendations

---

## 🔐 Secure Authentication

* User Authentication
* JWT Authorization
* Protected Routes
* Secure Session Management

---

# ⚙️ System Workflow

```text
                     User Login
                         │
                         ▼
                 Select Investigation
                         │
                         ▼
              Upload Evidence Files
                (CSV / JSON Logs)
                         │
                         ▼
             Parse & Validate Evidence
                         │
                         ▼
          Timeline Reconstruction Engine
                         │
                         ▼
          Evidence Correlation Module
                         │
                         ▼
         MITRE ATT&CK Technique Mapping
                         │
                         ▼
          Cyber Kill Chain Analysis
                         │
                         ▼
           Incident Risk Assessment
                         │
                         ▼
       Automated Investigation Report
```

---

# 🏗️ System Architecture

```text
                 React + TypeScript
                         │
                         ▼
                 FastAPI REST API
                         │
        ┌─────────────────────────┐
        │                         │
        ▼                         ▼
 Timeline Engine          MITRE Mapping Engine
        │                         │
        └──────────────┬──────────┘
                       ▼
             Evidence Correlation
                       │
                       ▼
             Cyber Kill Chain Engine
                       │
                       ▼
               Incident Scoring
                       │
                       ▼
            Supabase PostgreSQL
```

---

# 🛠️ Technology Stack

| Category        | Technology          |
| --------------- | ------------------- |
| Frontend        | React 19            |
| Language        | TypeScript          |
| Styling         | Tailwind CSS        |
| Backend         | FastAPI             |
| Programming     | Python              |
| Database        | Supabase PostgreSQL |
| Authentication  | Supabase Auth + JWT |
| Deployment      | Vercel              |
| Backend Hosting | Railway             |
| Version Control | Git & GitHub        |

---

# 📂 Project Structure

```text
Interactive-DFIR-Reconstructor/

│── frontend/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   └── assets/
│
│── backend/
│   ├── api/
│   ├── models/
│   ├── services/
│   ├── parsers/
│   ├── mitre/
│   ├── timeline/
│   └── reports/
│
│── database/
│
│── docs/
│
│── sample-data/
│
│── screenshots/
│
└── README.md

---

# 📈 Expected Outcomes

✅ Faster Incident Investigation

✅ Automated Timeline Reconstruction

✅ Improved Evidence Correlation

✅ Standardized Threat Analysis

✅ Accurate MITRE ATT&CK Mapping

✅ Better Decision Making

✅ Professional Investigation Reports

---

# 🔮 Future Enhancements

* 🤖 AI-Assisted Threat Analysis
* 🧠 LLM-based Investigation Assistant
* 🛡️ IOC Extraction
* 📡 SIEM Integration (Splunk / Wazuh / ELK)
* 📊 Real-Time Investigation Dashboard
* 👥 Role-Based Access Control (RBAC)
* ☁️ Cloud-Native Deployment
* 📱 Responsive Mobile Interface
* 📌 Timeline Collaboration
* 🔍 Threat Intelligence Integration

---

# 📚 References

* MITRE ATT&CK Framework
* Lockheed Martin Cyber Kill Chain
* NIST SP 800-61 Rev.2
* OWASP Security Guidelines
* FastAPI Documentation
* React Documentation
* Supabase Documentation
* PostgreSQL Documentation

---

# 👨‍💻 Author

**Final Year Cybersecurity Project**

Interactive DFIR Incident Timeline Reconstructor

Developed for academic research, cybersecurity education, and practical Digital Forensics & Incident Response workflows.

---

<p align="center">

⭐ **If you found this project useful, consider giving it a Star!** ⭐

</p>
