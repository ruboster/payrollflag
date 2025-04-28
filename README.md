# Payroll Launch Risk Assessment System

A tool to flag integration gaps, dependency risks, and missing steps before launching a payroll system.

## Overview

This system helps identify potential risks in the payroll launch process by analyzing task completion status and notes for risk indicators. It consists of:

1. **Backend Risk Checker Script**: Python script that analyzes CSV data to identify incomplete tasks and risky notes.
2. **Frontend Dashboard**: Web interface that displays flagged tasks, alerts, and a risk summary.

## Features

- Identifies incomplete tasks
- Flags risky notes containing keywords like "assumed", "unverified", etc.
- Displays a dashboard with color-coded risk levels
- Shows Slack-style alerts for high-priority issues
- Provides a summary of risk areas across departments

## Getting Started

### Prerequisites

- Python 3.6 or higher
- Web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone this repository: