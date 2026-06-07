import type { ApplyOneEnv } from "../env";
import { json } from "../index";

export const ownerProfile = {
  name: "Aboulfazl Saeedi",
  professionalName: "Alberto Saeedi",
  location: "Madrid, Spain",
  workPermit: "Spain long-term",
  phone: "+34 603 226 886",
  email: "albertosaeedi@gmail.com",
  linkedin: "linkedin.com/in/aboulfazl-saeedi-026716225",
  github: "github.com/albeen-sknight",
  languages: ["Spanish: native", "Persian: native", "English: C1"],
  targetRoles: ["Junior SOC Analyst", "CyberSOC", "Junior Cybersecurity", "IT Support", "Helpdesk", "Systems Administration"],
  targetMarket: "Madrid, Spain",
  preferredLanguage: "Spanish",
  education: [
    "ASIR, Network Systems Administration - IES Clara del Rey, 2025-2027, ongoing",
    "SMR, Microcomputer Systems and Networks - IES Barajas, 2023-2025"
  ],
  experience: [
    "Deloitte Madrid - Technology Trainee, CyberSOC Track, May 2026",
    "Atento / Securitas Direct Madrid - Customer Support / Call Center, Jul-Sep 2025",
    "Centric, Malta - IT Technician, Mar-May 2025",
    "United Networks, Remote - Volunteer, Training & Account Management, Oct 2022-Jun 2023"
  ],
  technicalSkills: [
    "SIEM",
    "Log analysis",
    "Alert triage",
    "Windows Event Logs",
    "KQL",
    "Elastic Stack",
    "Active Directory",
    "Windows/Linux",
    "Basic GRC",
    "SecOps detection and response"
  ],
  certifications: [
    "SecOps: Detection and Response - LinkedIn Learning, 2026",
    "SIEM Introduction - LinkedIn Learning, 2026",
    "Threat Landscape - LinkedIn Learning, 2026",
    "Basic GRC - LinkedIn Learning, 2026"
  ],
  projects: [
    "Windows Event Log Analysis & Attack Simulation Lab",
    "Windows Event Log Investigation: Auditing Settings Modification",
    "Elastic Stack / KQL - Failed Logon Analysis",
    "SIEM Virtualisation - Failed Logon Attempts, All Users + Disabled Users",
    "Deloitte Final Project - Internal Web App"
  ]
};

export function handleProfile(_request: Request, _env: ApplyOneEnv) {
  return json(ownerProfile);
}
