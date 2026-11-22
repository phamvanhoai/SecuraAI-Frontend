# SecuraAI full-demo narration

This English narration follows the automated runner. Speak naturally while each chapter overlay is visible. The default pauses produce a report-oriented demo of roughly 12–15 minutes, depending on model inference time.

## 1. Administrator workspace

“First, the Administrator prepares the organizational environment. Administrators manage user accounts and fixed system roles, while contextual responsibilities such as Risk Owner, Control Owner, Asset Owner and Authorized Approver remain Employee responsibilities rather than additional global roles.”

## 2. Users, roles and ownership

“From User Management, the Administrator can create or import users, maintain departments and assign one contextual responsibility to an eligible Employee. Actual assets, controls and risks are still assigned in their owning modules.”

## 3. Integration API keys

“Integration API keys authenticate supported external systems. Secret values are protected, while scopes, status and expiration remain manageable and auditable.”

## 4. Audit governance

“Important user actions and configuration changes are recorded in the audit trail to support accountability and later investigation.”

## 5–8. Security management foundation

“The Security Officer maintains the asset inventory and business context, identifies risks and their owners, assesses inherent risk, links security controls and evidence, and manages the security-policy lifecycle. These governance records give later security events and incidents meaningful organizational context.”

## 9. Event sources

“SecuraAI accepts normalized security events from registered sources. The Security Officer demonstrates source registration, reviews the active Wazuh source and opens the connection diagnostic. Source credentials are used only for the test and are never displayed or stored by the demo runner.”

## 9A. Security event inspection and entity mapping

“Each normalized event retains source telemetry, identity and asset associations, ingestion metadata and raw evidence. The Review and Correct Entity Mapping workflow lets an authorized Security Officer correct an inaccurate user, asset or monitored-account association while preserving traceability.”

## 9B. Detection configuration and manual operation

“The Detection and Explanation Models page separates behavioral detection from the language model used to explain stored evidence. The model threshold applies by default, while an asset override supports a justified asset-specific threshold. Manual detection processes at most one hundred stored pending events; realtime Wazuh events continue through the scheduled pipeline automatically.”

## 10. Wazuh multi-family simulation

“The visible PowerShell tool now generates four controlled families: Authentication, Application Access, VPN and SSO. These events travel through the Windows Wazuh agent and Manager; they are not inserted directly into the SecuraAI database.”

## 11. Ingested security events

“The Event Ingestion page confirms that the source events were received and normalized. Original event evidence remains available even when downstream AI analysis fails or does not create an alert.”

## 12. Automated anomaly analysis

“The scheduled backend pipeline collects unprocessed events and builds temporal context over one, five, fifteen and sixty minutes. The trained model performs first-stage classification. Events escalated by the model are verified by Foundation-Sec. Only a final malicious decision meeting the applicable threshold creates or updates an alert.”

## 13. Alert explanation and analyst triage

“The Security Officer reviews the stored explanation and contributing evidence, starts triage and confirms one verified alert as a true positive. The system stores the analyst, reason, time and model version, then creates a linked incident draft. Ollama does not calculate the anomaly score.”

## 14–15. Incident and reassessment workflow

“The incident workflow supports severity classification, handler assignment, containment, eradication, recovery and lessons learned. The Security Officer may link affected assets, controls and an existing risk, record a control weakness and request risk reassessment. An incident can also be reported manually without an AI alert.”

## 16. Risk Owner

“The assigned Risk Owner reviews incident-driven reassessment requests. When accepted, the owner reassesses residual likelihood and impact using current incident findings and control evidence. Access remains ownership-scoped.”

## 17. Control Owner

“The Control Owner reviews assigned controls, implementation status, evidence and effectiveness work. This responsibility does not grant access to every control in the organization.”

## 18. Asset Owner

“The Asset Owner sees assigned assets and their linked business and security context. Empty eligible workspaces remain visible even when no asset is currently assigned.”

## 19. Authorized Approver

“The Authorized Approver reviews workflow-specific pending risk-acceptance decisions. This contextual responsibility never grants organization-wide approval authority.”

## 20–21. Employee self-service

“Employees can read and acknowledge applicable published policies, manage personal notifications and review incident reports associated with their account. In the current system contract, operational incident creation and response remain Security Officer actions.”

## 22–23. Executive dashboard and reports

“Finally, the Executive reviews consolidated security posture, risk, incident and alert indicators. Authorized users can export filtered risk, incident and security reports. This closes the end-to-end loop from governance and Wazuh telemetry through detection, response, reassessment and management reporting.”
