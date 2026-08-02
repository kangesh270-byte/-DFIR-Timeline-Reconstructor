-- Supabase schema for DFIR Timeline Reconstructor

create extension if not exists "uuid-ossp";

create table if not exists public.scenarios (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  difficulty text,
  category text,
  description text,
  target_host text,
  threat_actor text,
  evidence_count integer default 0,
  time_window text,
  narrative text,
  recommendations jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.evidence (
  id uuid primary key default uuid_generate_v4(),
  scenario_id uuid references public.scenarios(id) on delete cascade,
  title text not null,
  timestamp text,
  true_timestamp_ms bigint,
  category text,
  severity text,
  source text,
  description text,
  host text,
  user text,
  raw_log text,
  hint text,
  correct_mitre_techniques jsonb default '[]'::jsonb,
  correct_kill_chain text,
  created_at timestamptz default now()
);

create table if not exists public.timeline_events (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid,
  evidence_id uuid,
  timestamp text,
  order_index integer default 0,
  assigned_mitre_technique_ids text,
  assigned_kill_chain_stage text,
  created_at timestamptz default now()
);

create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  scenario_id uuid references public.scenarios(id) on delete set null,
  scenario_title text,
  score integer default 0,
  accuracy_percentage integer default 0,
  stars_earned integer default 0,
  narrative text,
  weaknesses jsonb default '[]'::jsonb,
  recommendations jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.leaderboard (
  id uuid primary key default uuid_generate_v4(),
  username text not null,
  title text,
  xp integer default 0,
  labs_completed integer default 0,
  avg_accuracy integer default 0,
  avatar text,
  created_at timestamptz default now()
);

create table if not exists public.relationships (
  id uuid primary key default uuid_generate_v4(),
  scenario_id uuid references public.scenarios(id) on delete cascade,
  source_id text,
  target_id text,
  type text,
  created_at timestamptz default now()
);

create table if not exists public.timeline_placements (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid references public.reports(id) on delete cascade,
  evidence_id uuid,
  order_index integer default 0,
  assigned_mitre_technique_ids text,
  assigned_kill_chain_stage text,
  created_at timestamptz default now()
);

create table if not exists public.evaluation_results (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid references public.reports(id) on delete cascade,
  score integer default 0,
  max_score integer default 0,
  accuracy_percentage integer default 0,
  chronological_accuracy integer default 0,
  mitre_accuracy integer default 0,
  kill_chain_accuracy integer default 0,
  relationship_accuracy integer default 0,
  mistakes jsonb default '[]'::jsonb,
  hints jsonb default '[]'::jsonb,
  ai_analysis jsonb default '{}'::jsonb,
  stars_earned integer default 0,
  xp_gained integer default 0,
  time_taken_seconds integer default 0,
  created_at timestamptz default now()
);

insert into public.scenarios (id, title, difficulty, category, description, target_host, threat_actor, evidence_count, time_window, narrative, recommendations)
values
  ('277d95ca-124c-4913-b082-4b5e9226fdb3', 'Operation Velvet Snare', 'Hard', 'Ransomware', 'Investigate a coordinated ransomware intrusion spanning phishing, persistence, and exfiltration.', 'WS-FIN-042', 'BlackCat', 12, '2026-10-12 08:00 - 10:30 UTC', 'A phishing attachment led to execution, credential theft, and ransomware deployment.', '["Review email gateway logs.", "Isolate and collect LSASS memory images.", "Validate user account privileges."]'::jsonb),
  ('dcd07e50-1608-4ca7-a6de-29046b34d946', 'Operation Nightwatch', 'Medium', 'Credential Theft', 'Investigate a targeted credential theft campaign against the finance team.', 'WS-ENG-021', 'FIN7', 8, '2026-10-13 09:00 - 11:00 UTC', 'An adversary exploited a password spray and moved laterally to a privileged workstation.', '["Review MFA logs.", "Audit privileged group membership.", "Collect host memory images."]'::jsonb)
on conflict (id) do nothing;

insert into public.relationships (id, scenario_id, source_id, target_id, type)
values
  ('a8bb8f72-4c49-4f3d-8b4b-9129dcf081fe', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'EV-101', 'EV-102', 'Downloaded'),
  ('f4e0ee96-f55d-44ef-82ba-9f0b-43dbf583abf2', 'dcd07e50-1608-4ca7-a6de-29046b34d946', 'EV-201', 'EV-202', 'CredentialAccess')
on conflict (id) do nothing;

insert into public.evidence (id, scenario_id, title, timestamp, true_timestamp_ms, category, severity, source, description, host, user, raw_log, hint, correct_mitre_techniques, correct_kill_chain)
values
  ('f3d41e72-2634-4e61-b719-2d267f190b61', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'Phishing Email Delivered', '2026-10-12 08:14:02 UTC', 1728800000000, 'Email', 'High', 'Email Gateway', 'A macro-enabled Excel attachment was delivered to a finance user. IOC: email subject Invoice_2026_10_12.pdf; attachment sha256 8f2b0cb5f3c5ab2aa202d5e2b4d2ac0c.', 'WS-FIN-042', 'finance-user', 'Email from external sender with malicious macro attachment.', 'Start with the initial access artifact.', '[{"id":"T1566.001","name":"Spearphishing Attachment","tactic":"Initial Access","description":"Phishing attachment"}]'::jsonb, 'Delivery'),
  ('4d9dc4d2-f594-4b7f-8d46-70da9f64f4db', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'PowerShell Execution', '2026-10-12 08:22:18 UTC', 1728800001000, 'PowerShell', 'Critical', 'Sysmon', 'PowerShell executed an encoded payload from a remote path. IOC: process powershell.exe; commandline -enc JABzAGQ=', 'WS-FIN-042', 'finance-user', 'Process creation event for powershell.exe with encoded script.', 'Watch for execution follow-on activity.', '[{"id":"T1059.001","name":"PowerShell","tactic":"Execution","description":"PowerShell execution"}]'::jsonb, 'Exploitation'),
  ('11111111-1111-4111-8111-111111111111', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'Malicious Attachment Opened', '2026-10-12 08:16:33 UTC', 1728800002000, 'Email', 'High', 'Microsoft 365 Audit', 'User opened a macro-enabled Excel workbook from an external sender. IOC: attachment name invoice_ledger.xlsm.', 'WS-FIN-042', 'finance-user', 'User opened the attachment and enabled editing mode.', 'Review the user interaction and mail transport path.', '[{"id":"T1204.002","name":"User Execution","tactic":"Execution","description":"User executed a malicious attachment"}]'::jsonb, 'Delivery'),
  ('22222222-2222-4222-8222-222222222222', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'CMD Execution', '2026-10-12 08:24:11 UTC', 1728800003000, 'Command Line', 'High', 'Sysmon', 'The user session launched cmd.exe to execute the downloaded payload. IOC: process cmd.exe; parent process Excel.EXE.', 'WS-FIN-042', 'finance-user', 'Process creation event for cmd.exe with child process rundll32.exe.', 'Check command shell activity for follow-on execution.', '[{"id":"T1059.003","name":"Windows Command Shell","tactic":"Execution","description":"Command shell execution"}]'::jsonb, 'Exploitation'),
  ('33333333-3333-4333-8333-333333333333', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'Scheduled Task Created', '2026-10-12 08:29:05 UTC', 1728800004000, 'Scheduled Task', 'High', 'Task Scheduler', 'A scheduled task was created to relaunch the payload at startup. IOC: task name UpdateCheck; action C:\Windows\System32\cmd.exe /c start.', 'WS-FIN-042', 'finance-user', 'Task scheduler event with task registration for UpdateCheck.', 'Investigate persistence mechanisms.', '[{"id":"T1053.005","name":"Scheduled Task","tactic":"Persistence","description":"Scheduled task persistence"}]'::jsonb, 'Installation'),
  ('44444444-4444-4434-8434-444444444444', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'Registry Run Key Modified', '2026-10-12 08:30:42 UTC', 1728800005000, 'Registry', 'High', 'Registry', 'The malware added a Run key for persistence. IOC: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\UpdateCheck.', 'WS-FIN-042', 'finance-user', 'Registry value set under CurrentVersion\Run.', 'Look for startup persistence.', '[{"id":"T1547.001","name":"Registry Run Keys / Startup Folder","tactic":"Persistence","description":"Run key persistence"}]'::jsonb, 'Installation'),
  ('55555555-5555-4535-8535-555555555555', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'Administrator Group Change', '2026-10-12 08:36:10 UTC', 1728800006000, 'Security', 'Critical', 'Windows Security Event Log', 'A service account was added to the local Administrators group. IOC: user svc-finops; group Administrators.', 'DC-FIN-01', 'svc-finops', 'Security event 4732 shows group membership change.', 'Review privilege escalation and administrative abuse.', '[{"id":"T1098.003","name":"Additional Local or Domain Groups","tactic":"Privilege Escalation","description":"Added account to local administrators"}]'::jsonb, 'Exploitation'),
  ('66666666-6666-4636-8636-666666666666', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'LSASS Memory Access', '2026-10-12 08:38:05 UTC', 1728800007000, 'Memory', 'Critical', 'LSASS', 'Credential dumping targeted LSASS memory. IOC: process lsass.exe; access denied by Defender.', 'DC-FIN-01', 'svc-finops', 'Memory access event against lsass.exe.', 'Collect memory image and validate credential theft.', '[{"id":"T1003.001","name":"LSASS Memory","tactic":"Credential Access","description":"Credential dumping against LSASS"}]'::jsonb, 'Exploitation'),
  ('77777777-7777-4737-8737-777777777777', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'Mimikatz Execution', '2026-10-12 08:39:18 UTC', 1728800008000, 'Credential Theft', 'Critical', 'Sysmon', 'Mimikatz was executed to dump credentials. IOC: process mimikatz.exe; module sekurlsa::logonpasswords.', 'DC-FIN-01', 'svc-finops', 'Process creation event for mimikatz.exe.', 'Investigate credential theft and Kerberos abuse.', '[{"id":"T1003.001","name":"LSASS Memory","tactic":"Credential Access","description":"Credential dumping with Mimikatz"}]'::jsonb, 'Exploitation'),
  ('88888888-8888-4838-8838-888888888888', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'Network Scan Performed', '2026-10-12 08:41:52 UTC', 1728800009000, 'Network', 'High', 'Nmap', 'The attacker enumerated hosts and open services. IOC: target 10.10.10.20; ports 445, 3389.', 'WS-FIN-043', 'svc-finops', 'Nmap scan against internal finance subnet.', 'Review network discovery and lateral movement prep.', '[{"id":"T1046","name":"Network Service Discovery","tactic":"Discovery","description":"Internal network scan"}]'::jsonb, 'Exploitation'),
  ('99999999-9999-4939-8939-999999999999', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'Account Discovery', '2026-10-12 08:43:07 UTC', 1728800010000, 'Authentication', 'High', 'Windows Security Event Log', 'The attacker queried domain accounts for privileged targets. IOC: account svc-dcadmin; domain finance.local.', 'DC-FIN-01', 'svc-finops', 'Security event for account enumeration and discovery.', 'Investigate domain account reconnaissance.', '[{"id":"T1087.002","name":"Account Discovery","tactic":"Discovery","description":"Domain account discovery"}]'::jsonb, 'Exploitation'),
  ('aaaaaaaa-aaaa-4a3a-8a3a-aaaaaaaaaaaa', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'PsExec Remote Execution', '2026-10-12 08:47:18 UTC', 1728800011000, 'Remote Execution', 'Critical', 'PsExec', 'The attacker used PsExec to execute commands remotely. IOC: target \\DC-FIN-01\\ADMIN$; command psexec.exe.', 'DC-FIN-01', 'svc-finops', 'Remote service creation and execution via PsExec.', 'Review remote administration tool abuse.', '[{"id":"T1021.002","name":"Remote Services: SMB/Windows Admin Shares","tactic":"Lateral Movement","description":"PsExec remote execution"}]'::jsonb, 'Exploitation'),
  ('bbbbbbbb-bbbb-4b3b-8b3b-bbbbbbbbbbbb', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'SMB Lateral Movement', '2026-10-12 08:48:31 UTC', 1728800012000, 'Network', 'Critical', 'SMB', 'SMB traffic was observed between the compromised host and the domain controller. IOC: port 445/tcp; share ADMIN$.', 'WS-FIN-043', 'svc-finops', 'SMB session established to ADMIN$ share.', 'Investigate lateral movement via SMB.', '[{"id":"T1021.003","name":"SMB/Windows Admin Shares","tactic":"Lateral Movement","description":"SMB lateral movement"}]'::jsonb, 'Exploitation'),
  ('cccccccc-cccc-4c3c-8c3c-cccccccccccc', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'Sensitive File Access', '2026-10-12 08:52:09 UTC', 1728800013000, 'File Access', 'High', 'File Server', 'The attacker accessed sensitive finance files and export bundles. IOC: files payroll_2026.csv; finance_reports.xlsx.', 'FS-FIN-01', 'svc-finops', 'File access audit for finance data shares.', 'Review collection of sensitive information.', '[{"id":"T1005","name":"Data from Local System","tactic":"Collection","description":"Sensitive file access"}]'::jsonb, 'Exploitation'),
  ('dddddddd-dddd-4d3d-8d3d-dddddddddddd', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'Rclone Upload', '2026-10-12 09:01:04 UTC', 1728800014000, 'Exfiltration', 'Critical', 'Rclone', 'Rclone was used to upload files to an external cloud storage. IOC: remote gdrive://finance-backups; file archive *.zip.', 'WS-FIN-043', 'svc-finops', 'Outbound transfer event to cloud storage using rclone.', 'Inspect exfiltration attempts and cloud access logs.', '[{"id":"T1567.002","name":"Exfiltration to Cloud Storage","tactic":"Exfiltration","description":"Cloud exfiltration with Rclone"}]'::jsonb, 'Command and Control'),
  ('eeeeeeee-eeee-4e3e-8e3e-eeeeeeeeeeee', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'HTTPS Data Transfer', '2026-10-12 09:08:21 UTC', 1728800015000, 'Network', 'High', 'Proxy', 'HTTPS outbound traffic transferred staged archives to an external IP. IOC: destination 203.0.113.44:443.', 'WS-FIN-043', 'svc-finops', 'Outbound HTTPS connection to external IP.', 'Check network egress controls and proxy logs.', '[{"id":"T1041","name":"Exfiltration Over C2 Channel","tactic":"Exfiltration","description":"HTTPS exfiltration"}]'::jsonb, 'Command and Control'),
  ('ffffffff-ffff-4f3f-8f3f-ffffffffffff', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'BlackCat Encryption', '2026-10-12 09:19:41 UTC', 1728800016000, 'Ransomware', 'Critical', 'Sysmon', 'The ransomware encrypted files and dropped a ransom note. IOC: extension .blackcat; file C:\Users\Public\Desktop\README.txt.', 'WS-FIN-042', 'svc-finops', 'Process creation and file encryption activity.', 'Contain the ransomware and preserve evidence.', '[{"id":"T1486","name":"Data Encrypted for Impact","tactic":"Impact","description":"Ransomware encryption"}]'::jsonb, 'Actions on Objectives'),
  ('10101010-1010-4110-8100-101010101010', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'Shadow Copy Deletion', '2026-10-12 09:21:03 UTC', 1728800017000, 'Ransomware', 'Critical', 'Windows Event Log', 'Shadow copies were deleted to prevent recovery. IOC: vssadmin delete shadows /all /quiet.', 'WS-FIN-042', 'svc-finops', 'Event log indicates shadow copy deletion.', 'Prioritize recovery and backup validation.', '[{"id":"T1490","name":"Inhibit System Recovery","tactic":"Impact","description":"Shadow copy deletion"}]'::jsonb, 'Actions on Objectives'),
  ('12121212-1212-4212-8212-121212121212', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'Ransom Note Left', '2026-10-12 09:22:11 UTC', 1728800018000, 'Ransomware', 'High', 'File System', 'A ransom note was written to the desktop and shared folders. IOC: file README_TO_DECRYPT.txt.', 'WS-FIN-042', 'svc-finops', 'File written to user desktop.', 'Coordinate response with legal and communications teams.', '[{"id":"T1486","name":"Data Encrypted for Impact","tactic":"Impact","description":"Ransom note delivery"}]'::jsonb, 'Actions on Objectives'),
  ('2a9241ed-1c0d-46ec-b2aa-b9168e44d489', 'dcd07e50-1608-4ca7-a6de-29046b34d946', 'Password Spray Attempt', '2026-10-13 09:05:11 UTC', 1728900000000, 'Authentication', 'Medium', 'Azure AD', 'Multiple failed sign-ins against a finance account were recorded.', 'WS-ENG-021', 'svc-admin', 'Authentication log showing repeated password spray attempts.', 'Start from the first compromised identity.', '[{"id":"T1110.003","name":"Password Spraying","tactic":"Credential Access","description":"Password spraying"}]'::jsonb, 'Delivery')
on conflict (id) do nothing;

insert into public.timeline_events (id, report_id, evidence_id, timestamp, order_index, assigned_mitre_technique_ids, assigned_kill_chain_stage)
values
  ('b5e06e4b-5fbe-4f9f-a4e2-5b98e85fd770', null, 'f3d41e72-2634-4e61-b719-2d267f190b61', '2026-10-12 08:14:02 UTC', 1, 'T1566.001', 'Delivery'),
  ('ae153f3a-d49a-40bc-a094-ea3d2ed80b3d', null, '4d9dc4d2-f594-4b7f-8d46-70da9f64f4db', '2026-10-12 08:22:18 UTC', 2, 'T1059.001', 'Exploitation'),
  ('11111111-1111-4111-8111-111111111111', null, '11111111-1111-4111-8111-111111111111', '2026-10-12 08:16:33 UTC', 3, 'T1204.002', 'Delivery'),
  ('22222222-2222-4222-8222-222222222222', null, '22222222-2222-4222-8222-222222222222', '2026-10-12 08:24:11 UTC', 4, 'T1059.003', 'Exploitation'),
  ('33333333-3333-4333-8333-333333333333', null, '33333333-3333-4333-8333-333333333333', '2026-10-12 08:29:05 UTC', 5, 'T1053.005', 'Installation'),
  ('44444444-4444-4434-8434-444444444444', null, '44444444-4444-4434-8434-444444444444', '2026-10-12 08:30:42 UTC', 6, 'T1547.001', 'Installation'),
  ('55555555-5555-4535-8535-555555555555', null, '55555555-5555-4535-8535-555555555555', '2026-10-12 08:36:10 UTC', 7, 'T1098.003', 'Exploitation'),
  ('66666666-6666-4636-8636-666666666666', null, '66666666-6666-4636-8636-666666666666', '2026-10-12 08:38:05 UTC', 8, 'T1003.001', 'Exploitation'),
  ('77777777-7777-4737-8737-777777777777', null, '77777777-7777-4737-8737-777777777777', '2026-10-12 08:39:18 UTC', 9, 'T1003.001', 'Exploitation'),
  ('88888888-8888-4838-8838-888888888888', null, '88888888-8888-4838-8838-888888888888', '2026-10-12 08:41:52 UTC', 10, 'T1046', 'Exploitation'),
  ('99999999-9999-4939-8939-999999999999', null, '99999999-9999-4939-8939-999999999999', '2026-10-12 08:43:07 UTC', 11, 'T1087.002', 'Exploitation'),
  ('aaaaaaaa-aaaa-4a3a-8a3a-aaaaaaaaaaaa', null, 'aaaaaaaa-aaaa-4a3a-8a3a-aaaaaaaaaaaa', '2026-10-12 08:47:18 UTC', 12, 'T1021.002', 'Exploitation'),
  ('bbbbbbbb-bbbb-4b3b-8b3b-bbbbbbbbbbbb', null, 'bbbbbbbb-bbbb-4b3b-8b3b-bbbbbbbbbbbb', '2026-10-12 08:48:31 UTC', 13, 'T1021.003', 'Exploitation'),
  ('cccccccc-cccc-4c3c-8c3c-cccccccccccc', null, 'cccccccc-cccc-4c3c-8c3c-cccccccccccc', '2026-10-12 08:52:09 UTC', 14, 'T1005', 'Exploitation'),
  ('dddddddd-dddd-4d3d-8d3d-dddddddddddd', null, 'dddddddd-dddd-4d3d-8d3d-dddddddddddd', '2026-10-12 09:01:04 UTC', 15, 'T1567.002', 'Command and Control'),
  ('eeeeeeee-eeee-4e3e-8e3e-eeeeeeeeeeee', null, 'eeeeeeee-eeee-4e3e-8e3e-eeeeeeeeeeee', '2026-10-12 09:08:21 UTC', 16, 'T1041', 'Command and Control'),
  ('ffffffff-ffff-4f3f-8f3f-ffffffffffff', null, 'ffffffff-ffff-4f3f-8f3f-ffffffffffff', '2026-10-12 09:19:41 UTC', 17, 'T1486', 'Actions on Objectives'),
  ('10101010-1010-4110-8100-101010101010', null, '10101010-1010-4110-8100-101010101010', '2026-10-12 09:21:03 UTC', 18, 'T1490', 'Actions on Objectives'),
  ('12121212-1212-4212-8212-121212121212', null, '12121212-1212-4212-8212-121212121212', '2026-10-12 09:22:11 UTC', 19, 'T1486', 'Actions on Objectives')
on conflict (id) do nothing;

insert into public.reports (id, scenario_id, scenario_title, score, accuracy_percentage, stars_earned, narrative, weaknesses, recommendations)
values
  ('fbd4d8ed-8e07-4c11-8ff2-a66de29b72aa', '277d95ca-124c-4913-b082-4b5e9226fdb3', 'Operation Velvet Snare', 910, 91, 3, 'A phishing attachment led to execution, credential theft, and ransomware deployment.', '["LSASS memory access was not contained."]'::jsonb, '["Review email gateway logs.", "Isolate and collect memory images."]'::jsonb)
on conflict (id) do nothing;

insert into public.leaderboard (id, username, title, xp, labs_completed, avg_accuracy, avatar)
values
  ('44814a17-c4fa-4de4-bf7a-3263d5f5715a', 'CyberNinja_01', 'Senior DFIR Specialist', 4850, 12, 96, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'),
  ('73ff99d7-c3eb-44ff-8c70-83bb7d3f9e18', 'ThreatHunterX', 'SOC Incident Commander', 4120, 10, 92, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'),
  ('2f2f0ed1-b57a-4ab4-b1bb-a62f4f81eb95', 'Alex_Vance_DFIR', 'Lead Incident Responder', 3250, 5, 88, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80')
on conflict (id) do nothing;
