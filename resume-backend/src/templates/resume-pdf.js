/**
 * LinkedIn 스타일 이력서 PDF HTML 템플릿
 * resume 데이터를 받아 완성된 HTML 문자열을 반환
 */
export function renderResumePDF(resume) {
  const { profile, skills, experience, education, certifications, personalProjects } = resume;

  const skillsHTML = (skills || []).map(skill => `
    <div class="skill-group">
      <span class="skill-category">${escapeHtml(skill.category)}</span>
      <div class="skill-items">
        ${(skill.items || []).map(item => `<span class="skill-tag">${escapeHtml(item)}</span>`).join('')}
      </div>
    </div>
  `).join('');

  const experienceHTML = [...(experience || [])]
    .sort((a, b) => {
      // 역순 정렬: 최신 경력이 위로
      const periodA = a.period || '';
      const periodB = b.period || '';
      return periodB.localeCompare(periodA);
    })
    .map(exp => `
    <div class="experience-item">
      <div class="exp-header">
        <div>
          <h3 class="exp-project">${escapeHtml(exp.project || '')}</h3>
          <p class="exp-company">${escapeHtml(exp.company || '')}${exp.position ? ` | ${escapeHtml(exp.position)}` : ''}</p>
        </div>
        <span class="exp-period">${escapeHtml(exp.period || '')}</span>
      </div>
      ${exp.description ? `<p class="exp-description">${escapeHtml(exp.description)}</p>` : ''}
      ${(exp.techStack && exp.techStack.length > 0) ? `
        <div class="tech-stack">
          ${exp.techStack.map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');

  const educationHTML = (education || []).map(edu => `
    <div class="education-item">
      <div class="edu-header">
        <h3>${escapeHtml(edu.school || '')}</h3>
        <span class="edu-period">${escapeHtml(edu.period || '')}</span>
      </div>
      ${edu.major ? `<p class="edu-major">${escapeHtml(edu.major)}</p>` : ''}
    </div>
  `).join('');

  const projectsHTML = (personalProjects || []).map(proj => `
    <div class="project-item">
      <div class="project-header">
        <h3 class="project-name">${escapeHtml(proj.name || '')}</h3>
        ${proj.link ? `<a class="project-link" href="${escapeHtml(proj.link)}">${escapeHtml(proj.link)}</a>` : ''}
      </div>
      ${proj.description ? `<p class="project-desc">${escapeHtml(proj.description)}</p>` : ''}
    </div>
  `).join('');

  const certificationsHTML = (certifications || []).map(cert => `
    <div class="cert-item">
      <span class="cert-name">${escapeHtml(cert.name || '')}</span>
      ${cert.date ? `<span class="cert-date">${escapeHtml(cert.date)}</span>` : ''}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Noto Sans KR', sans-serif;
      color: #333;
      background: #fff;
      font-size: 10pt;
      line-height: 1.5;
    }

    .container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 24px 32px;
    }

    /* Header */
    .header {
      border-bottom: 2px solid #0a66c2;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }

    .header h1 {
      font-size: 22pt;
      font-weight: 700;
      color: #191919;
      margin-bottom: 2px;
    }

    .header .role {
      font-size: 12pt;
      color: #0a66c2;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 9pt;
      color: #666;
    }

    .contact-info span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Summary */
    .summary {
      margin-bottom: 20px;
      font-size: 10pt;
      color: #444;
      line-height: 1.6;
    }

    /* Section */
    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 13pt;
      font-weight: 700;
      color: #191919;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }

    /* Skills */
    .skill-group {
      margin-bottom: 8px;
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .skill-category {
      font-weight: 500;
      color: #333;
      font-size: 9pt;
      min-width: 100px;
      flex-shrink: 0;
    }

    .skill-items {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .skill-tag {
      background: #e8f4fd;
      color: #0a66c2;
      padding: 1px 8px;
      border-radius: 3px;
      font-size: 8.5pt;
    }

    /* Experience */
    .experience-item {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;
    }

    .experience-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
    }

    .exp-project {
      font-size: 11pt;
      font-weight: 600;
      color: #191919;
    }

    .exp-company {
      font-size: 9pt;
      color: #666;
      margin-top: 1px;
    }

    .exp-period {
      font-size: 9pt;
      color: #666;
      white-space: nowrap;
      flex-shrink: 0;
      margin-left: 16px;
    }

    .exp-description {
      font-size: 9.5pt;
      color: #444;
      margin-top: 6px;
      line-height: 1.6;
      white-space: pre-line;
    }

    .tech-stack {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }

    .tech-tag {
      background: #f3f3f3;
      color: #555;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 8pt;
    }

    /* Education */
    .education-item {
      margin-bottom: 8px;
    }

    .edu-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .edu-header h3 {
      font-size: 10pt;
      font-weight: 500;
      color: #191919;
    }

    .edu-period {
      font-size: 9pt;
      color: #666;
    }

    .edu-major {
      font-size: 9pt;
      color: #666;
    }

    /* Certifications */
    .cert-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .cert-name {
      font-size: 10pt;
      color: #333;
    }

    .cert-date {
      font-size: 9pt;
      color: #666;
    }

    /* Personal Projects */
    .project-item {
      margin-bottom: 10px;
    }

    .project-header {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }

    .project-name {
      font-size: 10pt;
      font-weight: 500;
      color: #191919;
    }

    .project-link {
      font-size: 8.5pt;
      color: #0a66c2;
      text-decoration: none;
    }

    .project-desc {
      font-size: 9pt;
      color: #666;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(profile.name || '')}</h1>
      <div class="role">${escapeHtml(profile.role || '')}</div>
      <div class="contact-info">
        ${profile.email ? `<span>${escapeHtml(profile.email)}</span>` : ''}
        ${profile.phone ? `<span>${escapeHtml(profile.phone)}</span>` : ''}
        ${profile.address ? `<span>${escapeHtml(profile.address)}</span>` : ''}
      </div>
    </div>

    ${profile.summary ? `
    <div class="summary">${escapeHtml(profile.summary)}</div>
    ` : ''}

    ${skillsHTML ? `
    <div class="section">
      <h2 class="section-title">Skills</h2>
      ${skillsHTML}
    </div>
    ` : ''}

    ${experienceHTML ? `
    <div class="section">
      <h2 class="section-title">Experience</h2>
      ${experienceHTML}
    </div>
    ` : ''}

    ${educationHTML ? `
    <div class="section">
      <h2 class="section-title">Education</h2>
      ${educationHTML}
    </div>
    ` : ''}

    ${certificationsHTML ? `
    <div class="section">
      <h2 class="section-title">Certifications</h2>
      ${certificationsHTML}
    </div>
    ` : ''}

    ${projectsHTML ? `
    <div class="section">
      <h2 class="section-title">Personal Projects</h2>
      ${projectsHTML}
    </div>
    ` : ''}
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
