import { MitreTactic, MitreTechnique, KillChainStage } from '../types';

export const ALL_MITRE_TACTICS: MitreTactic[] = [
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Collection',
  'Command and Control',
  'Exfiltration',
  'Impact',
];

export const ALL_KILL_CHAIN_STAGES: KillChainStage[] = [
  'Reconnaissance',
  'Weaponization',
  'Delivery',
  'Exploitation',
  'Installation',
  'Command and Control',
  'Actions on Objectives',
];

export const MITRE_TECHNIQUES: MitreTechnique[] = [
  // Initial Access
  {
    id: 'T1566.001',
    name: 'Spearphishing Attachment',
    tactic: 'Initial Access',
    description: 'Adversaries send spearphishing emails with a malicious file attached to gain entry.',
  },
  {
    id: 'T1566.002',
    name: 'Spearphishing Link',
    tactic: 'Initial Access',
    description: 'Adversaries send emails containing malicious links to credential harvesters or malware.',
  },
  {
    id: 'T1190',
    name: 'Exploit Public-Facing Application',
    tactic: 'Initial Access',
    description: 'Adversaries exploit weaknesses in Internet-facing software to gain initial access.',
  },
  {
    id: 'T1078',
    name: 'Valid Accounts',
    tactic: 'Initial Access',
    description: 'Adversaries obtain and use credentials of existing legitimate accounts.',
  },
  {
    id: 'T1195.002',
    name: 'Supply Chain Compromise: Software Supply Chain',
    tactic: 'Initial Access',
    description: 'Adversaries manipulate software dependencies or build systems to deliver malware.',
  },

  // Execution
  {
    id: 'T1059.001',
    name: 'PowerShell',
    tactic: 'Execution',
    description: 'Adversaries abuse PowerShell command-line interpreter for code execution.',
  },
  {
    id: 'T1059.003',
    name: 'Windows Command Shell',
    tactic: 'Execution',
    description: 'Adversaries use cmd.exe to execute commands and scripts.',
  },
  {
    id: 'T1204.002',
    name: 'User Execution: Malicious File',
    tactic: 'Execution',
    description: 'A user opens an attachment or executable file sent by an adversary.',
  },
  {
    id: 'T1047',
    name: 'Windows Management Instrumentation (WMI)',
    tactic: 'Execution',
    description: 'Adversaries abuse WMI to execute commands or gather information.',
  },

  // Persistence
  {
    id: 'T1547.001',
    name: 'Registry Run Keys / Startup Folder',
    tactic: 'Persistence',
    description: 'Adversaries add entries to Registry Run keys to achieve persistence upon boot.',
  },
  {
    id: 'T1053.005',
    name: 'Scheduled Task',
    tactic: 'Persistence',
    description: 'Adversaries abuse Windows Task Scheduler to execute programs on schedule or boot.',
  },
  {
    id: 'T1543.003',
    name: 'Windows Service',
    tactic: 'Persistence',
    description: 'Adversaries create or modify Windows services to execute malicious code automatically.',
  },

  // Privilege Escalation
  {
    id: 'T1068',
    name: 'Exploitation for Privilege Escalation',
    tactic: 'Privilege Escalation',
    description: 'Adversaries exploit software vulnerabilities to elevate access privileges.',
  },
  {
    id: 'T1548.002',
    name: 'Bypass User Account Control (UAC)',
    tactic: 'Privilege Escalation',
    description: 'Adversaries bypass UAC mechanisms to elevate process privileges.',
  },
  {
    id: 'T1078.003',
    name: 'Domain Accounts',
    tactic: 'Privilege Escalation',
    description: 'Adversaries compromise and leverage Domain Admin accounts.',
  },

  // Credential Access
  {
    id: 'T1003.001',
    name: 'LSASS Memory Dumping',
    tactic: 'Credential Access',
    description: 'Adversaries dump LSASS memory using tools like Mimikatz or ProcDump to harvest hashes.',
  },
  {
    id: 'T1003.002',
    name: 'Security Account Manager (SAM)',
    tactic: 'Credential Access',
    description: 'Adversaries extract password hashes stored in the SAM registry hive.',
  },
  {
    id: 'T1558.003',
    name: 'Kerberoasting',
    tactic: 'Credential Access',
    description: 'Adversaries request Kerberos TGS tickets for Service Principal Names and crack them offline.',
  },
  {
    id: 'T1110',
    name: 'Brute Force / Password Spray',
    tactic: 'Credential Access',
    description: 'Adversaries test common passwords against multiple accounts.',
  },

  // Discovery
  {
    id: 'T1087.002',
    name: 'Domain Account Discovery',
    tactic: 'Discovery',
    description: 'Adversaries query domain controllers to list domain users and administrators.',
  },
  {
    id: 'T1083',
    name: 'File and Directory Discovery',
    tactic: 'Discovery',
    description: 'Adversaries enumerate important files, shares, or network drives.',
  },
  {
    id: 'T1018',
    name: 'Remote System Discovery',
    tactic: 'Discovery',
    description: 'Adversaries search for other systems on the network (e.g. using AdFind or ping sweep).',
  },

  // Lateral Movement
  {
    id: 'T1021.001',
    name: 'Remote Desktop Protocol (RDP)',
    tactic: 'Lateral Movement',
    description: 'Adversaries log into remote workstations or servers via RDP using stolen credentials.',
  },
  {
    id: 'T1021.002',
    name: 'SMB / Windows Admin Shares',
    tactic: 'Lateral Movement',
    description: 'Adversaries use SMB/PsExec to move laterally across internal networks.',
  },
  {
    id: 'T1570',
    name: 'Lateral Tool Transfer',
    tactic: 'Lateral Movement',
    description: 'Adversaries transfer files between systems inside an compromised network.',
  },

  // Collection
  {
    id: 'T1005',
    name: 'Data from Local System',
    tactic: 'Collection',
    description: 'Adversaries collect sensitive files or databases stored on the target machine.',
  },
  {
    id: 'T1560.001',
    name: 'Archive via Utility (7-Zip / RAR)',
    tactic: 'Collection',
    description: 'Adversaries compress and encrypt gathered files into archives prior to exfiltration.',
  },

  // Command and Control
  {
    id: 'T1071.001',
    name: 'Web Protocols (HTTP/HTTPS C2)',
    tactic: 'Command and Control',
    description: 'Adversaries communicate with external C2 infrastructure using HTTP/S requests.',
  },
  {
    id: 'T1095',
    name: 'Non-Application Layer Protocol',
    tactic: 'Command and Control',
    description: 'Adversaries use raw socket connections, ICMP, or custom TCP protocols for C2.',
  },
  {
    id: 'T1105',
    name: 'Ingress Tool Transfer',
    tactic: 'Command and Control',
    description: 'Adversaries download additional tools, payloads, or implants from external servers.',
  },

  // Exfiltration
  {
    id: 'T1048.003',
    name: 'Exfiltration Over Alternative Protocol (DNS/FTP)',
    tactic: 'Exfiltration',
    description: 'Adversaries exfiltrate stolen data using protocols like DNS tunneling or Mega/FTP uploads.',
  },

  // Impact
  {
    id: 'T1486',
    name: 'Data Encrypted for Impact (Ransomware)',
    tactic: 'Impact',
    description: 'Adversaries encrypt target data on local systems or network shares to extort victims.',
  },
  {
    id: 'T1490',
    name: 'Inhibit System Recovery (vssadmin delete shadows)',
    tactic: 'Impact',
    description: 'Adversaries delete volume shadow copies or backup files to prevent recovery.',
  },
  {
    id: 'T1489',
    name: 'Service Stop',
    tactic: 'Impact',
    description: 'Adversaries stop critical antivirus, database, or logging services prior to encryption.',
  },
];
