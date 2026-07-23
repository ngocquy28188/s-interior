// M.interior Core Logic

// DOM Selector Helper
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

// Configuration & State

const INTERIOR_TYPES = [
  { 
    id: 'living', 
    name: 'Phòng khách', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18V11a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7"/><path d="M2 14v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4"/><path d="M6 12v3"/><path d="M18 12v3"/><path d="M12 8v7"/></svg>` 
  },
  { 
    id: 'bedroom', 
    name: 'Phòng ngủ', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v3"/><path d="M10 8v3"/></svg>` 
  },
  { 
    id: 'kitchen', 
    name: 'Phòng bếp & ăn', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h-3V3h3v5z"/><path d="M16.5 8v13"/><path d="M6 3v8a3 3 0 0 0 3 3h.5V3"/><path d="M7.5 14v7"/></svg>` 
  },
  { 
    id: 'bathroom', 
    name: 'Phòng tắm / WC', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v3H4z"/><path d="M7 7v10a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V7"/><path d="M12 1v3"/></svg>` 
  },
  { 
    id: 'office', 
    name: 'Phòng làm việc', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>` 
  },
  { 
    id: 'balcony', 
    name: 'Ban công / Ngoài trời', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22c1.25-6.5 5.5-12 12-16 2-1.25 4.5-2.5 8-2.5V6c0 3.5-1.25 6-2.5 8-4 6.5-9.5 10.75-16 12z"/><path d="M10 14L4 20"/></svg>` 
  }
];

const COLOR_PRESETS = [
  { 
    id: 'cream-wood', 
    name: 'Kem & Gỗ Sồi', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/><path d="M7 8h10"/><path d="M7 16h10"/></svg>`, 
    desc: 'cream fabric upholstery, warm oak wood panels, soft white walls' 
  },
  { 
    id: 'walnut-stone', 
    name: 'Gỗ Óc Chó & Đá', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`, 
    desc: 'dark walnut wood accents, white marble stone top, charcoal gray details' 
  },
  { 
    id: 'luxury-gold', 
    name: 'Vàng Kim & Trắng', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.9 2.9M14.8 14.8l2.9 2.9M6.3 17.7l2.9-2.9M14.8 9.2l2.9-2.9"/></svg>`, 
    desc: 'polished brass metal accents, glossy white stone surfaces, beige velvet fabric' 
  },
  { 
    id: 'industrial-gray', 
    name: 'Xám bê tông & Sắt', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>`, 
    desc: 'exposed concrete walls, black metal frames, dark leather upholstery' 
  },
  { 
    id: 'minimal-white', 
    name: 'Trắng tối giản', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg>`, 
    desc: 'pure white matte surfaces, light birch wood accents, clear glass' 
  },
  { 
    id: 'custom', 
    name: 'Tự chọn', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.52 22 22 17.52 22 12S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zM12 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-4 4.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm8 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-8 4.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>`, 
    desc: '' 
  }
];

const STYLE_PRESETS = [
  { 
    id: 'modern', 
    name: 'Hiện đại (Modern)', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>`, 
    desc: 'clean lines, functional furniture, sleek minimalist layout' 
  },
  { 
    id: 'luxury', 
    name: 'Sang trọng (Luxury)', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3 8 9l4 12 4-12-3-6"/></svg>`, 
    desc: 'high-end premium finishes, sophisticated luxury furniture, ambient lighting' 
  },
  { 
    id: 'scandinavian', 
    name: 'Bắc Âu (Scandinavian)', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`, 
    desc: 'bright light oak, cozy textiles, clean Scandinavian hygge vibe' 
  },
  { 
    id: 'indochine', 
    name: 'Đông Dương (Indochine)', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86z"/></svg>`, 
    desc: 'vintage cement tiles, dark wood furniture, traditional Vietnamese Indochine charm' 
  },
  { 
    id: 'japandi', 
    name: 'Japandi', 
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"/><path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6"/></svg>`, 
    desc: 'warm minimalist, Japanese clean layout meets Scandinavian natural elements' 
  }
];

let selectedInteriorType = INTERIOR_TYPES[0].id;
let selectedColor = COLOR_PRESETS[0].id;
let selectedStyle = STYLE_PRESETS[0].id;
let selectedImageFile = null;
let isGenerating = false;

// Render3D (Sketch → 3D) state variables
let selectedR3dImageFile = null;
let isGeneratingR3d = false;

// Lifestyle (Real-life) state variables
let selectedLsImageFile = null;
let isGeneratingLs = false;
let selectedLsStage = 'delivery';

// Design mode: 'redesign' | 'keepstyle'
let designMode = 'redesign';


// Initialize app when DOM loads
window.addEventListener('DOMContentLoaded', () => {
  renderOptions();
  setupEventListeners();
  initPipelineButtons();
  loadSettings();
  renderHistory();
  initQuotation();
  
  // PocketBase status indicator check
  checkPBConnection();
});

// Sync connection status with db
async function checkPBConnection() {
  const pbStatus = $('#pbSyncStatus');
  if (!pbStatus) return;
  try {
    const res = await fetch(`${window.API || ''}/api/pb-load?key=settings`);
    if (res.ok) {
      pbStatus.className = 'pb-status online';
      pbStatus.textContent = '🟢 PocketBase: Connected';
    } else {
      pbStatus.className = 'pb-status offline';
      pbStatus.textContent = '🔴 PocketBase: Connected failed';
    }
  } catch {
    pbStatus.className = 'pb-status offline';
    pbStatus.textContent = '🔴 PocketBase: Offline';
  }
}

// Render dynamic selections (Pill style)
function renderOptions() {
  // Room types -> pill buttons
  const grid = $('#interiorGrid');
  if (grid) {
    const roomIcons = {
      living: '🛋️', bedroom: '🛌', kitchen: '🍳',
      bathroom: '🛁', office: '💻', balcony: '🌿'
    };
    grid.innerHTML = INTERIOR_TYPES.map(t =>
      `<button class="pill-btn ${t.id === selectedInteriorType ? 'active' : ''}" data-id="${t.id}">${roomIcons[t.id] || '🟨'} ${t.name}</button>`
    ).join('');
  }

  // Color Presets -> pill buttons
  const palette = $('#colorPalette');
  if (palette) {
    const colorDots = {
      'cream-wood': '#d2b48c', 'walnut-stone': '#4b3621',
      'luxury-gold': '#d4af37', 'industrial-gray': '#666',
      'minimal-white': '#ddd', 'custom': '#888'
    };
    palette.innerHTML = COLOR_PRESETS.map(c => {
      const dot = colorDots[c.id]
        ? `<span style="width:8px;height:8px;border-radius:50%;background:${colorDots[c.id]};display:inline-block;margin-right:2px;flex-shrink:0;"></span>`
        : '';
      return `<button class="pill-btn ${c.id === selectedColor ? 'active' : ''}" data-id="${c.id}">${dot}${c.name}</button>`;
    }).join('');
  }

  // Styles -> pill buttons
  const styleContainer = $('#styleOptions');
  if (styleContainer) {
    const styleIcons = {
      modern: '⬛', luxury: '💎', scandinavian: '🌿',
      indochine: '🏮', japandi: '⚫'
    };
    styleContainer.innerHTML = STYLE_PRESETS.map(s =>
      `<button class="pill-btn ${s.id === selectedStyle ? 'active' : ''}" data-id="${s.id}">${styleIcons[s.id] || '✨'} ${s.name}</button>`
    ).join('');
  }
}

// Helper to provide a nice visual representation color dot
function getColorPreviewBackground(id) {
  switch (id) {
    case 'cream-wood': return 'linear-gradient(135deg, #f5f5dc 50%, #d2b48c 50%)';
    case 'walnut-stone': return 'linear-gradient(135deg, #4b3621 50%, #e0e0e0 50%)';
    case 'luxury-gold': return 'linear-gradient(135deg, #ffd700 50%, #ffffff 50%)';
    case 'industrial-gray': return 'linear-gradient(135deg, #808080 50%, #333333 50%)';
    case 'minimal-white': return 'linear-gradient(135deg, #ffffff 50%, #f0f0f0 50%)';
    default: return 'linear-gradient(135deg, #888888 50%, #555555 50%)';
  }
}

// Attach all DOM Event Listeners
function setupEventListeners() {
  // Tab Bar Switching
  $$('.tab-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      switchTab(tabId);
    });
  });

  // Design Mode Toggle
  $('#designModeGroup')?.addEventListener('click', e => {
    const btn = e.target.closest('.mode-btn');
    if (!btn) return;
    designMode = btn.dataset.mode;
    $$('#designModeGroup .mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Show/hide panels
    $('#panelRedesign').style.display  = designMode === 'redesign'   ? 'flex' : 'none';
    $('#panelKeepStyle').style.display = designMode === 'keepstyle'  ? 'flex' : 'none';
    // Update button label
    const txt = $('#btnGenerateText');
    if (txt) txt.textContent = designMode === 'keepstyle' ? '✨ Thêm Trang Trí AI' : '🪄 Thiết Kế Nội Thất AI';
    validateForm();
  });

  // r3dOutputMode pill handler
  $('#r3dOutputMode')?.addEventListener('click', e => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    $$('#r3dOutputMode .pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });

  // Pill selection handlers for interiorGrid
  $('#interiorGrid')?.addEventListener('click', e => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    selectedInteriorType = btn.dataset.id;
    $$('#interiorGrid .pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    validateForm();
  });

  // Pill selection for colorPalette
  $('#colorPalette')?.addEventListener('click', e => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    selectedColor = btn.dataset.id;
    $$('#colorPalette .pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const customWrap = $('.custom-color-wrap');
    if (selectedColor === 'custom') {
      customWrap.style.display = 'block';
      $('#customColor').focus();
    } else {
      customWrap.style.display = 'none';
    }
    validateForm();
  });

  // Pill selection for styleOptions
  $('#styleOptions')?.addEventListener('click', e => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    selectedStyle = btn.dataset.id;
    $$('#styleOptions .pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    validateForm();
  });

  // Render3D pill selections
  $('#r3dOutputMode')?.addEventListener('click', e => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    $$('#r3dOutputMode .pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });

  $('#r3dStyleMode')?.addEventListener('click', e => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    $$('#r3dStyleMode .pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });

  // Render3D File Upload
  const r3dUploadArea = $('#r3dUploadArea');
  const r3dFileInput = $('#r3dImageInput');

  r3dUploadArea?.addEventListener('click', () => {
    if (!selectedR3dImageFile) r3dFileInput.click();
  });

  r3dFileInput?.addEventListener('change', e => {
    if (e.target.files.length > 0) handleR3dImageSelection(e.target.files[0]);
  });

  r3dUploadArea?.addEventListener('dragover', e => {
    e.preventDefault();
    r3dUploadArea.style.borderColor = 'var(--primary-gold)';
  });

  r3dUploadArea?.addEventListener('dragleave', () => {
    r3dUploadArea.style.borderColor = 'rgba(255, 255, 255, 0.15)';
  });

  r3dUploadArea?.addEventListener('drop', e => {
    e.preventDefault();
    r3dUploadArea.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    if (e.dataTransfer.files.length > 0) handleR3dImageSelection(e.dataTransfer.files[0]);
  });

  $('#btnRemoveR3dImage')?.addEventListener('click', e => {
    e.stopPropagation();
    selectedR3dImageFile = null;
    $('#r3dImageInput').value = '';
    $('#r3dPreviewContainer').style.display = 'none';
    $('#r3dUploadPlaceholder').style.display = 'flex';
    validateForm();
  });

  // Render3D Generate Action
  $('#btnGenerateR3d')?.addEventListener('click', startRender3dGeneration);

  // Lived-in Generate Action (kept if still referenced)
  $('#btnGenerateLivedIn')?.addEventListener('click', () => toast('Tab này đã được thay bằng Render 3D.', 'info'));

  // File Upload
  const uploadArea = $('#uploadArea');
  const fileInput = $('#imageInput');

  uploadArea?.addEventListener('click', () => {
    if (!selectedImageFile) fileInput.click();
  });

  fileInput?.addEventListener('change', e => {
    if (e.target.files.length > 0) {
      handleImageSelection(e.target.files[0]);
    }
  });

  // Drag and Drop
  uploadArea?.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary-gold)';
  });

  uploadArea?.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.15)';
  });

  uploadArea?.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    if (e.dataTransfer.files.length > 0) {
      handleImageSelection(e.dataTransfer.files[0]);
    }
  });

  // Remove image
  $('#btnRemoveImage')?.addEventListener('click', e => {
    e.stopPropagation();
    selectedImageFile = null;
    $('#imageInput').value = '';
    $('#previewContainer').style.display = 'none';
    $('#uploadPlaceholder').style.display = 'flex';
    validateForm();
  });

  // Advanced settings toggling
  $('#advancedToggle')?.addEventListener('click', () => {
    const panel = $('#advancedPanel');
    const arrow = $('#advancedToggle .arrow');
    if (panel.style.display === 'none') {
      panel.style.display = 'block';
      arrow.textContent = '▲';
    } else {
      panel.style.display = 'none';
      arrow.textContent = '▼';
    }
  });

  // Generate Action — routes via pipeline engine
  $('#btnGenerate')?.addEventListener('click', () => {
    runPipeline();
  });

  // Reuse generated image as input
  $('#btnReuseAsInput')?.addEventListener('click', async () => {
    const resultImg = $('#resultImage');
    if (!resultImg || !resultImg.src) return;
    
    try {
      toast('⏳ Đang chuyển đổi phối cảnh thành ảnh gốc...', 'info');
      const response = await fetch(resultImg.src);
      const blob = await response.blob();
      const file = new File([blob], 'reused-interior-base.jpg', { type: 'image/jpeg' });
      
      handleImageSelection(file);
      switchTab('tab-design');
      toast('✅ Đã nạp phối cảnh làm ảnh gốc mới!', 'success');
    } catch (err) {
      console.error(err);
      toast('❌ Không thể nạp ảnh làm ảnh gốc.', 'error');
    }
  });

  // Download with Watermark
  $('#btnDownload')?.addEventListener('click', e => {
    const url = $('#resultImage').src;
    if (url) downloadWithWatermark(e, url, 'mkg-interior-design.jpg');
  });

  $('#lightboxDownload')?.addEventListener('click', e => {
    const url = $('#lightboxImg').src;
    if (url) downloadWithWatermark(e, url, 'mkg-interior-design.jpg');
  });

  // Lightbox close
  $('#lightboxClose')?.addEventListener('click', () => {
    $('#lightbox').classList.remove('open');
  });

  // Settings Actions
  $('#saveSettings')?.addEventListener('click', saveSettings);
  $('#btnUploadWatermark')?.addEventListener('click', () => $('#watermarkLogoInput').click());
  $('#watermarkLogoInput')?.addEventListener('change', handleWatermarkLogoUpload);
  $('#btnRemoveWatermark')?.addEventListener('click', removeWatermarkLogo);
  
  $('#tabSettingsBtn')?.addEventListener('click', () => switchTab('tab-settings'));
  $('#btnCloseSettings')?.addEventListener('click', () => switchTab('tab-design'));

  // History Actions
  $('#btnClearHistory')?.addEventListener('click', () => {
    if (confirm('Bạn chắc chắn muốn xóa toàn bộ lịch sử thiết kế?')) {
      localStorage.removeItem('banana_interior_history');
      renderHistory();
      toast('🧹 Đã xóa sạch lịch sử.', 'success');
    }
  });

  // --- Multi-Angle Event Listeners ---
  const maUploadZone = $('#maUploadZone');
  const maImageInput = $('#maImageInput');
  const maGenerateBtn = $('#maGenerateBtn');

  if (maUploadZone && maImageInput && maGenerateBtn) {
    maUploadZone.addEventListener('click', () => {
      maImageInput.click();
    });

    maImageInput.addEventListener('change', e => {
      if (e.target.files.length > 0) {
        handleMaImagesSelection(e.target.files);
      }
      e.target.value = '';
    });

    maUploadZone.addEventListener('dragover', e => {
      e.preventDefault();
      maUploadZone.style.borderColor = 'var(--primary-gold)';
    });

    maUploadZone.addEventListener('dragleave', () => {
      maUploadZone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    });

    maUploadZone.addEventListener('drop', e => {
      e.preventDefault();
      maUploadZone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      if (e.dataTransfer.files.length > 0) {
        handleMaImagesSelection(e.dataTransfer.files);
      }
    });

    maGenerateBtn.addEventListener('click', startMultiAngleAnalysis);
  }

  // ── Lifestyle Tab ──────────────────────────────

  // Stage switcher
  $('#lsStageGroup')?.addEventListener('click', e => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    selectedLsStage = btn.dataset.value;
    $$('#lsStageGroup .pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Show/hide panels
    $$('.ls-panel').forEach(p => p.style.display = 'none');
    const panel = $(`#lsPanel-${selectedLsStage}`);
    if (panel) panel.style.display = 'block';
  });

  // Pill group handlers inside panels
  ['lsDeliveryTime','lsWorkerCount','lsConstructionLevel','lsDayTime','lsRealism'].forEach(groupId => {
    $(`#${groupId}`)?.addEventListener('click', e => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      $$(`#${groupId} .pill-btn`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Upload
  const lsUploadArea = $('#lsUploadArea');
  const lsFileInput  = $('#lsImageInput');

  lsUploadArea?.addEventListener('click', () => {
    if (!selectedLsImageFile) lsFileInput.click();
  });
  lsFileInput?.addEventListener('change', e => {
    if (e.target.files.length > 0) handleLsImageSelection(e.target.files[0]);
  });
  lsUploadArea?.addEventListener('dragover', e => {
    e.preventDefault();
    lsUploadArea.style.borderColor = 'var(--primary-gold)';
  });
  lsUploadArea?.addEventListener('dragleave', () => {
    lsUploadArea.style.borderColor = 'rgba(255,255,255,0.15)';
  });
  lsUploadArea?.addEventListener('drop', e => {
    e.preventDefault();
    lsUploadArea.style.borderColor = 'rgba(255,255,255,0.15)';
    if (e.dataTransfer.files.length > 0) handleLsImageSelection(e.dataTransfer.files[0]);
  });
  $('#btnRemoveLsImage')?.addEventListener('click', e => {
    e.stopPropagation();
    selectedLsImageFile = null;
    $('#lsImageInput').value = '';
    $('#lsPreviewContainer').style.display = 'none';
    $('#lsUploadPlaceholder').style.display = 'flex';
    validateForm();
  });
  $('#btnGenerateLifestyle')?.addEventListener('click', startLifestyleGeneration);
}

// Handle selected image file
function handleImageSelection(file) {
  if (!file.type.startsWith('image/')) {
    toast('❌ Vui lòng chọn file hình ảnh hợp lệ.', 'error');
    return;
  }
  selectedImageFile = file;

  const reader = new FileReader();
  reader.onload = e => {
    $('#imagePreview').src = e.target.result;
    $('#uploadPlaceholder').style.display = 'none';
    $('#previewContainer').style.display = 'block';
    validateForm();
  };
  reader.readAsDataURL(file);
}

// Check form values and enable/disable generate button
function validateForm() {
  const btn = $('#btnGenerate');
  if (btn) {
    const hasImage = !!selectedImageFile;
    const busy = isGenerating || isGeneratingR3d;

    // keepstyle mode: just need an image
    // redesign mode: need image + valid color
    let ready;
    if (designMode === 'keepstyle') {
      ready = hasImage && !busy;
    } else {
      const isCustomColorValid = selectedColor !== 'custom' || ($('#customColor')?.value.trim().length > 0);
      ready = hasImage && isCustomColorValid && !busy;
    }

    if (ready) btn.removeAttribute('disabled');
    else        btn.setAttribute('disabled', 'true');
  }

  const lsBtn = $('#btnGenerateLifestyle');
  if (lsBtn) {
    if (selectedLsImageFile && !isGeneratingLs) lsBtn.removeAttribute('disabled');
    else lsBtn.setAttribute('disabled', 'true');
  }
}


// Helper to detect closest aspect ratio from a file
async function getImageClosestRatio(file) {
  if (!file) return 'SQUARE';
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      URL.revokeObjectURL(img.src);
      if (w && h) {
        const r = w / h;
        if (r > 1.2) resolve('LANDSCAPE');
        else if (r < 0.8) resolve('PORTRAIT');
        else resolve('SQUARE');
      } else {
        resolve('SQUARE');
      }
    };
    img.onerror = () => {
      resolve('SQUARE');
    };
  });
}

// AI Interior Design generation pipeline
async function startInteriorGeneration() {
  if (isGenerating || !selectedImageFile) return;

  isGenerating = true;
  validateForm();
  toggleLoadingState(true, 'Đang phân tích không gian phòng...');

  let intervalId;

  try {
    const typeObj = INTERIOR_TYPES.find(t => t.id === selectedInteriorType);
    let colorName = '';
    let colorDesc = '';
    
    if (selectedColor === 'custom') {
      const customVal = $('#customColor').value.trim();
      colorName = customVal || 'màu tự chọn';
      colorDesc = `${customVal || 'custom color'} material scheme`;
    } else {
      const colorObj = COLOR_PRESETS.find(c => c.id === selectedColor);
      colorName = colorObj.name;
      colorDesc = colorObj.desc;
    }
    
    const styleObj = STYLE_PRESETS.find(s => s.id === selectedStyle);
    
    // 2. Call /api/interior-prompt to generate AI prompt
    const formData = new FormData();
    formData.append('image', selectedImageFile);
    formData.append('roomType', typeObj.name);
    formData.append('colorPalette', `${colorName} (${colorDesc})`);
    formData.append('designStyle', `${styleObj.name}${styleObj.desc ? ` (${styleObj.desc})` : ''}`);

    const promptRes = await fetch(`${window.API || ''}/api/interior-prompt`, { method: 'POST', body: formData });
    const promptData = await promptRes.json();
    
    if (promptData.error) throw new Error(promptData.error);
    const finalPrompt = promptData.prompt;
    $('#resultPrompt').value = finalPrompt;

    toggleLoadingState(true, 'Đang tải ảnh hiện trạng lên máy chủ...');

    // 3. Upload source image via upload-image API
    const uploadFormData = new FormData();
    uploadFormData.append('image', selectedImageFile);

    const uploadRes = await fetch(`${window.API || ''}/api/upload-image`, { method: 'POST', body: uploadFormData });
    const uploadData = await uploadRes.json();
    
    if (uploadData.error) throw new Error(uploadData.error);
    const mediaId = uploadData.media?.name;
    if (!mediaId) throw new Error('Không thể upload ảnh gốc lên Cloud.');

    toggleLoadingState(true, 'AI đang dựng phối cảnh nội thất...');

    // 4. Submit Task to Image-to-Image API (supports parallel tasks for quantity > 1)
    const outputRatioVal = $('#outputRatio').value;
    const aiModel = $('#aiModel').value;
    const quantity = parseInt($('#outputQuantity')?.value) || 1;

    let outputRatio = outputRatioVal;
    if (outputRatioVal === 'ORIGINAL') {
      outputRatio = await getImageClosestRatio(selectedImageFile);
      console.log('Original ratio closest match for Interior:', outputRatio);
    }

    const taskPromises = [];
    for (let q = 0; q < quantity; q++) {
      taskPromises.push((async () => {
        const taskRes = await fetch(`${window.API || ''}/api/image-to-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: finalPrompt,
            quantity: 1, // Enforce 1 to guarantee upstream returns separate images
            ratio: outputRatio,
            model: aiModel,
            mediaId: mediaId
          })
        });
        const taskData = await taskRes.json();
        if (taskData.error) throw new Error(taskData.error);
        const taskId = taskData.taskid || taskData.taskId;
        if (!taskId) throw new Error('Không nhận được mã tiến trình tạo ảnh.');
        return taskId;
      })());
    }

    const taskIds = await Promise.all(taskPromises);

    // 5. Poll task status for all tasks in parallel
    let elapsedSeconds = 0;
    intervalId = setInterval(() => {
      elapsedSeconds += 5;
      toggleLoadingState(true, `AI đang thi công phối cảnh... (${elapsedSeconds}s)`);
    }, 5000);

    const pollPromises = taskIds.map(taskId => pollGenerationStatus(taskId, () => {}, 60));
    const pollResults = await Promise.all(pollPromises);
    
    clearInterval(intervalId);

    // Combine results from all parallel tasks
    const results = [];
    pollResults.forEach(r => {
      if (r.result && r.result.length > 0) {
        results.push(...r.result);
      }
    });

    if (results.length === 0) {
      throw new Error('Lỗi đồng bộ kết quả phối cảnh từ server.');
    }

    const resultImageWrapper = $('#resultImageWrapper');
    const resultGridWrapper = $('#resultGridWrapper');

    if (quantity === 1) {
      // Single output mode
      const resultUrl = results[0]?.fifeUrl;
      if (!resultUrl) throw new Error('Không tìm thấy link ảnh kết quả.');
      
      const proxyUrl = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(resultUrl)}`;
      $('#resultImage').src = proxyUrl;
      $('#btnDownload').href = proxyUrl;
      $('#resultImage').onclick = () => openLightbox(proxyUrl);

      if (resultImageWrapper) resultImageWrapper.style.display = 'block';
      if (resultGridWrapper) resultGridWrapper.style.display = 'none';

      // Save to History
      saveToHistory(proxyUrl, finalPrompt);
    } else {
      // Multiple output mode (2-4 images)
      if (resultImageWrapper) resultImageWrapper.style.display = 'none';
      if (resultGridWrapper) {
        resultGridWrapper.innerHTML = '';
        resultGridWrapper.style.display = 'grid';

        results.forEach(item => {
          const proxyUrl = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(item.fifeUrl)}`;
          const img = document.createElement('img');
          img.src = proxyUrl;
          img.alt = 'Phối cảnh nội thất';
          img.style.width = '100%';
          img.style.borderRadius = 'var(--radius-md)';
          img.style.cursor = 'pointer';
          img.style.border = '1px solid rgba(255, 255, 255, 0.08)';
          img.style.transition = 'transform 0.2s ease, border-color 0.2s ease';
          img.onmouseenter = () => {
            img.style.transform = 'scale(1.02)';
            img.style.borderColor = 'var(--primary-gold)';
          };
          img.onmouseleave = () => {
            img.style.transform = 'scale(1)';
            img.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          };
          img.onclick = () => openLightbox(proxyUrl);
          resultGridWrapper.appendChild(img);

          // Save each image to history
          saveToHistory(proxyUrl, finalPrompt);
        });
      }
      
      // Default download button to first image
      if (results[0]?.fifeUrl) {
        const firstProxy = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(results[0].fifeUrl)}`;
        $('#btnDownload').href = firstProxy;
      }
    }

    const resultPlaceholder = $('#resultPlaceholder');
    if (resultPlaceholder) resultPlaceholder.style.display = 'none';

    $('#resultSection').style.display = 'block';
    switchTab('tab-result');

    toast('🎉 Tạo phối cảnh nội thất thành công!', 'success');

  } catch (err) {
    if (intervalId) clearInterval(intervalId);
    console.error(err);
    toast(`❌ Lỗi: ${err.message}`, 'error');
  } finally {
    isGenerating = false;
    toggleLoadingState(false);
    validateForm();
  }
}

// Render3D Image selection
function handleR3dImageSelection(file) {
  if (!file.type.startsWith('image/')) {
    toast('❌ Vui lòng chọn file hình ảnh hợp lệ.', 'error');
    return;
  }
  selectedR3dImageFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    $('#r3dImagePreview').src = e.target.result;
    $('#r3dUploadPlaceholder').style.display = 'none';
    $('#r3dPreviewContainer').style.display = 'block';
    validateForm();
  };
  reader.readAsDataURL(file);
}

// ── Lifestyle Image Handler ────────────────────────────
function handleLsImageSelection(file) {
  if (!file.type.startsWith('image/')) {
    toast('❌ Vui lòng chọn file hình ảnh hợp lệ.', 'error');
    return;
  }
  selectedLsImageFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    $('#lsImagePreview').src = e.target.result;
    $('#lsUploadPlaceholder').style.display = 'none';
    $('#lsPreviewContainer').style.display = 'block';
    validateForm();
  };
  reader.readAsDataURL(file);
}

// ── Lifestyle Generation Pipeline ─────────────────────
async function startLifestyleGeneration() {
  if (isGeneratingLs || !selectedLsImageFile) return;

  isGeneratingLs = true;
  validateForm();
  toggleLoadingState(true, 'Đang phân tích kịch bản...');

  let intervalId;

  try {
    // ── Collect all options based on active stage ──
    const stage = selectedLsStage;
    const getChecked = id => [...$$(`#${id} input[type="checkbox"]:checked`)].map(el => el.value);
    const getActivePill = id => $(`#${id} .pill-btn.active`)?.dataset.value || '';

    let sceneDescription = '';

    if (stage === 'delivery') {
      const items = getChecked('lsDeliveryItems');
      const time   = getActivePill('lsDeliveryTime');

      const itemLabels = {
        'cardboard-boxes':  'large cardboard delivery boxes scattered around the room',
        'wooden-crates':    'wooden crates and packing crates stacked against walls',
        'wrapped-furniture':'furniture pieces wrapped in protective stretch film and bubble wrap',
        'delivery-workers': '1-2 delivery workers in uniforms carrying and arranging items',
        'trolley-cart':     'a hand trolley/dolly cart loaded with boxes',
        'messy-floor':      'floor covered with packaging foam, plastic wrap and packing materials'
      };
      const timeLabels = {
        'morning':   'bright natural daylight streaming through windows',
        'afternoon': 'warm late-afternoon golden light'
      };

      sceneDescription = `DELIVERY SCENE: A real candid documentary photo of a brand-new interior room during furniture delivery. The room is filled with: ${items.map(k => itemLabels[k] || k).join('; ')}. Lighting: ${timeLabels[time] || 'natural daylight'}. The atmosphere is busy and realistic — the room is not staged, items are mid-delivery, slightly chaotic but exciting. The completed furniture and design can be seen partially unpacked, hinting at the final look.`;

    } else if (stage === 'construction') {
      const tasks  = getChecked('lsConstructionTasks');
      const workers = getActivePill('lsWorkerCount');
      const level   = getActivePill('lsConstructionLevel');

      const taskLabels = {
        'painting':    'workers in overalls painting walls with rollers and brushes',
        'carpentry':   'a carpenter installing custom wooden cabinets and furniture',
        'flooring':    'workers laying floor tiles or wood flooring',
        'electrical':  'an electrician installing light fixtures and running cables',
        'cleaning':    'workers doing final cleaning with mops and vacuum cleaners',
        'measuring':   'workers measuring walls and marking positions with tape measures and pencils'
      };
      const levelLabels = {
        'just-started': 'The room is at the very beginning of construction — bare walls, tools being set up, materials just arriving.',
        'mid':          'The room is mid-construction — scaffolding, tools, materials everywhere, work actively in progress.',
        'almost-done':  'The room is nearly complete — most work is done, only final finishing touches remain, the space is taking its beautiful final shape.'
      };

      sceneDescription = `CONSTRUCTION SCENE: A candid, documentary-style photo of the interior during renovation. ${levelLabels[level] || ''} ${workers} Vietnamese construction worker(s) are actively working. Visible tasks: ${tasks.map(k => taskLabels[k] || k).join('; ')}. There are construction tools, material bags, ladders, and protective tarps visible. The overall atmosphere is authentic and captures the transformation of this space in progress.`;

    } else if (stage === 'lived-in') {
      const people     = getChecked('lsPeopleTypes');
      const activities = getChecked('lsActivities');
      const timeOfDay  = getActivePill('lsDayTime');
      const realism    = getActivePill('lsRealism');

      const peopleLabels = {
        'adult-man':     'adult Vietnamese man',
        'adult-woman':   'adult Vietnamese woman',
        'elderly-man':   'elderly Vietnamese grandfather',
        'elderly-woman': 'elderly Vietnamese grandmother',
        'boy-child':     'young Vietnamese boy (age 6-10)',
        'girl-child':    'young Vietnamese girl (age 6-10)',
        'baby':          'a Vietnamese baby or toddler',
        'dog':           'a pet dog',
        'cat':           'a pet cat'
      };
      const activityLabels = {
        'watching-tv':    'relaxing and watching TV together on the sofa',
        'eating':         'eating a meal at the dining table',
        'working-laptop': 'working on a laptop',
        'reading':        'reading a book or newspaper',
        'playing-kids':   'children playing with toys on the floor',
        'cooking':        'cooking in the kitchen',
        'morning-coffee': 'drinking morning coffee',
        'video-call':     'having a video call on the phone',
        'yoga':           'doing yoga or light exercise'
      };
      const timeLabels = {
        'morning':  'early morning soft golden light, warm sunrise atmosphere',
        'daytime':  'bright natural daylight, clear and vibrant atmosphere',
        'evening':  'warm amber dusk light filtering through windows, cozy evening glow',
        'night':    'nighttime with warm indoor artificial lighting, lamps on, cozy and intimate'
      };
      const realismLabels = {
        'candid': 'candid, natural, unposed — people are not aware of the camera, spontaneous real-life moment',
        'staged': 'beautifully composed, editorial lifestyle photography style, people look relaxed and naturally photogenic',
        'raw':    'very realistic and raw — slight clutter, everyday items like water bottles, remote controls, slippers on floor, authentic Vietnamese daily life with visible electrical sockets and plugs on walls'
      };

      const peopleDesc = people.length > 0
        ? people.map(k => peopleLabels[k] || k).join(', ')
        : 'a Vietnamese family member';
      const activityDesc = activities.length > 0
        ? activities.map(k => activityLabels[k] || k).join(' and ')
        : 'relaxing at home';

      sceneDescription = `LIVED-IN SCENE: A ${realismLabels[realism] || 'candid'} photo of this interior being lived in. People present: ${peopleDesc}. They are ${activityDesc}. Time of day: ${timeLabels[timeOfDay] || 'daytime'}. CRITICAL: People must have authentic Vietnamese appearance — natural local features, NOT generic AI-generated model faces or Western-looking people. The scene must feel like a real Vietnamese home.`;
    }

    // ── Build and send prompt ──
    const formData = new FormData();
    formData.append('image', selectedLsImageFile);
    formData.append('stage', stage);
    formData.append('sceneDescription', sceneDescription);

    const promptRes = await fetch(`${window.API || ''}/api/lifestyle-prompt`, { method: 'POST', body: formData });
    const promptData = await promptRes.json();
    if (promptData.error) throw new Error(promptData.error);
    const finalPrompt = promptData.prompt;
    $('#resultPrompt').value = finalPrompt;

    toggleLoadingState(true, 'Đang tải ảnh lên máy chủ...');

    const uploadFormData = new FormData();
    uploadFormData.append('image', selectedLsImageFile);
    const uploadRes  = await fetch(`${window.API || ''}/api/upload-image`, { method: 'POST', body: uploadFormData });
    const uploadData = await uploadRes.json();
    if (uploadData.error) throw new Error(uploadData.error);
    const mediaId = uploadData.media?.name;
    if (!mediaId) throw new Error('Không thể upload ảnh gốc lên Cloud.');

    toggleLoadingState(true, 'AI đang dựng khung cảnh thực tế...');

    const outputRatioVal = $('#lsRatio').value;
    const quantity = parseInt($('#lsQuantity')?.value) || 1;
    let outputRatio = outputRatioVal;
    if (outputRatioVal === 'ORIGINAL') outputRatio = await getImageClosestRatio(selectedLsImageFile);

    const taskPromises = [];
    for (let q = 0; q < quantity; q++) {
      taskPromises.push((async () => {
        const taskRes = await fetch(`${window.API || ''}/api/image-to-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: finalPrompt, quantity: 1, ratio: outputRatio, model: 'Nano_Banana_Pro', mediaId })
        });
        const taskData = await taskRes.json();
        if (taskData.error) throw new Error(taskData.error);
        const taskId = taskData.taskid || taskData.taskId;
        if (!taskId) throw new Error('Không nhận được mã tiến trình.');
        return taskId;
      })());
    }

    const taskIds = await Promise.all(taskPromises);
    let elapsed = 0;
    intervalId = setInterval(() => {
      elapsed += 5;
      toggleLoadingState(true, `AI đang dựng khung cảnh thực tế... (${elapsed}s)`);
    }, 5000);

    const pollResults = await Promise.all(taskIds.map(id => pollGenerationStatus(id, () => {}, 60)));
    clearInterval(intervalId);

    const results = [];
    pollResults.forEach(r => { if (r.result?.length > 0) results.push(...r.result); });
    if (results.length === 0) throw new Error('Lỗi đồng bộ kết quả từ server.');

    const resultImageWrapper = $('#resultImageWrapper');
    const resultGridWrapper  = $('#resultGridWrapper');

    if (quantity === 1) {
      const proxyUrl = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(results[0]?.fifeUrl)}`;
      $('#resultImage').src = proxyUrl;
      $('#btnDownload').href = proxyUrl;
      $('#resultImage').onclick = () => openLightbox(proxyUrl);
      if (resultImageWrapper) resultImageWrapper.style.display = 'block';
      if (resultGridWrapper)  resultGridWrapper.style.display  = 'none';
      saveToHistory(proxyUrl, finalPrompt);
    } else {
      if (resultImageWrapper) resultImageWrapper.style.display = 'none';
      if (resultGridWrapper) {
        resultGridWrapper.innerHTML = '';
        resultGridWrapper.style.display = 'grid';
        results.forEach(item => {
          const proxyUrl = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(item.fifeUrl)}`;
          const img = document.createElement('img');
          img.src = proxyUrl;
          img.alt = 'Ảnh thực tế';
          img.style.cssText = 'width:100%;border-radius:var(--radius-md);cursor:pointer;border:1px solid rgba(255,255,255,0.08);transition:transform 0.2s,border-color 0.2s;';
          img.onmouseenter = () => { img.style.transform = 'scale(1.02)'; img.style.borderColor = 'var(--primary-gold)'; };
          img.onmouseleave = () => { img.style.transform = ''; img.style.borderColor = 'rgba(255,255,255,0.08)'; };
          img.onclick = () => openLightbox(proxyUrl);
          resultGridWrapper.appendChild(img);
          saveToHistory(proxyUrl, finalPrompt);
        });
        if (results[0]?.fifeUrl) $('#btnDownload').href = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(results[0].fifeUrl)}`;
      }
    }

    const placeholder = $('#resultPlaceholder');
    if (placeholder) placeholder.style.display = 'none';
    $('#resultSection').style.display = 'block';
    switchTab('tab-result');

    const stageEmojis = { delivery: '📦', construction: '🔨', 'lived-in': '🏠' };
    toast(`🎉 ${stageEmojis[stage] || '✅'} Tạo ảnh thực tế thành công!`, 'success');

  } catch (err) {
    if (intervalId) clearInterval(intervalId);
    console.error(err);
    toast(`❌ Lỗi: ${err.message}`, 'error');
  } finally {
    isGeneratingLs = false;
    toggleLoadingState(false);
    validateForm();
  }
}

// ── Render 3D Generation Pipeline ─────────────────────

async function startRender3dGeneration() {
  if (isGeneratingR3d || !selectedR3dImageFile) return;

  isGeneratingR3d = true;
  validateForm();
  toggleLoadingState(true, 'Đang phân tích phác thảo...', false, 'r3d');

  let intervalId;

  try {
    // Collect selected options
    const outputMode = $('#r3dOutputMode .pill-btn.active')?.dataset.value || '3d-photorealistic';
    const spaceStyle = $('#r3dStyleMode .pill-btn.active')?.dataset.value || 'modern';

    const outputModeLabels = {
      '3d-photorealistic': 'photorealistic 3D rendering with realistic textures and natural lighting',
      '3d-render': 'CGI architectural visualization render with dramatic cinematic lighting',
      '3d-sketch': '3D sketch-based conceptual render with artistic line work and light shading',
      '3d-night': 'nighttime 3D interior render with warm ambient lighting and moody atmosphere'
    };
    const styleLabels = {
      modern: 'Modern minimalist', luxury: 'Luxury high-end', minimal: 'Ultra minimalist',
      scandinavian: 'Scandinavian hygge', indochine: 'Indochine vintage'
    };

    // Collect all checked decorations
    const getChecked = (groupId) =>
      [...$$(`#${groupId} input[type="checkbox"]:checked`)].map(el => el.value);

    const decorLighting = getChecked('decorLighting');
    const decorSoft = getChecked('decorSoft');
    const decorWall = getChecked('decorWall');
    const allDecor = [...decorLighting, ...decorSoft, ...decorWall];

    const decorLabels = {
      'led-ceiling-cove': 'cove LED ceiling wash lighting (indirect warm glow)',
      'led-cabinet': 'LED under-cabinet accent lighting',
      'pendant-light': 'decorative pendant light fixture',
      'floor-lamp': 'stylish floor standing lamp',
      'strip-led': 'colorful LED strip accent lighting',
      'cushions': 'decorative cushions and throw pillows on sofa',
      'throw-blanket': 'cozy throw blanket draped over furniture',
      'rug': 'area rug on floor',
      'curtains': 'elegant window curtains',
      'wall-art': 'framed wall art paintings',
      'wall-mirror': 'decorative wall mirror',
      'plant-indoor': 'lush indoor plants and greenery',
      'bookshelf-decor': 'styled decorative shelf with books and objects',
      'vase-flowers': 'fresh flower vase centerpiece'
    };
    const decorText = allDecor.length > 0
      ? allDecor.map(k => decorLabels[k] || k).join(', ')
      : 'no additional decorations';

    // Build prompt via API
    const formData = new FormData();
    formData.append('image', selectedR3dImageFile);
    formData.append('outputMode', outputModeLabels[outputMode] || outputModeLabels['3d-photorealistic']);
    formData.append('spaceStyle', styleLabels[spaceStyle] || 'Modern minimalist');
    formData.append('decorItems', decorText);

    const promptRes = await fetch(`${window.API || ''}/api/render3d-prompt`, { method: 'POST', body: formData });
    const promptData = await promptRes.json();
    if (promptData.error) throw new Error(promptData.error);
    const finalPrompt = promptData.prompt;
    $('#resultPrompt').value = finalPrompt;

    toggleLoadingState(true, 'Đang tải ảnh lên máy chủ...');

    // Upload source image
    const uploadFormData = new FormData();
    uploadFormData.append('image', selectedR3dImageFile);
    const uploadRes = await fetch(`${window.API || ''}/api/upload-image`, { method: 'POST', body: uploadFormData });
    const uploadData = await uploadRes.json();
    if (uploadData.error) throw new Error(uploadData.error);
    const mediaId = uploadData.media?.name;
    if (!mediaId) throw new Error('Không thể upload ảnh gốc lên Cloud.');

    toggleLoadingState(true, 'AI đang dựng phối cảnh 3D...');

    const outputRatioVal = $('#r3dRatio').value;
    const quantity = parseInt($('#r3dQuantity')?.value) || 1;
    let outputRatio = outputRatioVal;
    if (outputRatioVal === 'ORIGINAL') {
      outputRatio = await getImageClosestRatio(selectedR3dImageFile);
    }

    const taskPromises = [];
    for (let q = 0; q < quantity; q++) {
      taskPromises.push((async () => {
        const taskRes = await fetch(`${window.API || ''}/api/image-to-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: finalPrompt, quantity: 1, ratio: outputRatio, model: 'Nano_Banana_Pro', mediaId })
        });
        const taskData = await taskRes.json();
        if (taskData.error) throw new Error(taskData.error);
        const taskId = taskData.taskid || taskData.taskId;
        if (!taskId) throw new Error('Không nhận được mã tiến trình.');
        return taskId;
      })());
    }

    const taskIds = await Promise.all(taskPromises);
    let elapsedSeconds = 0;
    intervalId = setInterval(() => {
      elapsedSeconds += 5;
      toggleLoadingState(true, `AI đang dựng phối cảnh 3D... (${elapsedSeconds}s)`);
    }, 5000);

    const pollResults = await Promise.all(taskIds.map(id => pollGenerationStatus(id, () => {}, 60)));
    clearInterval(intervalId);

    const results = [];
    pollResults.forEach(r => { if (r.result?.length > 0) results.push(...r.result); });
    if (results.length === 0) throw new Error('Lỗi đồng bộ kết quả từ server.');

    const resultImageWrapper = $('#resultImageWrapper');
    const resultGridWrapper = $('#resultGridWrapper');

    if (quantity === 1) {
      const resultUrl = results[0]?.fifeUrl;
      if (!resultUrl) throw new Error('Không tìm thấy link ảnh kết quả.');
      const proxyUrl = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(resultUrl)}`;
      $('#resultImage').src = proxyUrl;
      $('#btnDownload').href = proxyUrl;
      $('#resultImage').onclick = () => openLightbox(proxyUrl);
      if (resultImageWrapper) resultImageWrapper.style.display = 'block';
      if (resultGridWrapper) resultGridWrapper.style.display = 'none';
      saveToHistory(proxyUrl, finalPrompt);
    } else {
      if (resultImageWrapper) resultImageWrapper.style.display = 'none';
      if (resultGridWrapper) {
        resultGridWrapper.innerHTML = '';
        resultGridWrapper.style.display = 'grid';
        results.forEach(item => {
          const proxyUrl = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(item.fifeUrl)}`;
          const img = document.createElement('img');
          img.src = proxyUrl;
          img.alt = 'Phối cảnh 3D';
          img.style.cssText = 'width:100%;border-radius:var(--radius-md);cursor:pointer;border:1px solid rgba(255,255,255,0.08);transition:transform 0.2s,border-color 0.2s;';
          img.onmouseenter = () => { img.style.transform = 'scale(1.02)'; img.style.borderColor = 'var(--primary-gold)'; };
          img.onmouseleave = () => { img.style.transform = ''; img.style.borderColor = 'rgba(255,255,255,0.08)'; };
          img.onclick = () => openLightbox(proxyUrl);
          resultGridWrapper.appendChild(img);
          saveToHistory(proxyUrl, finalPrompt);
        });
      }
      if (results[0]?.fifeUrl) $('#btnDownload').href = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(results[0].fifeUrl)}`;
    }

    const resultPlaceholder = $('#resultPlaceholder');
    if (resultPlaceholder) resultPlaceholder.style.display = 'none';
    $('#resultSection').style.display = 'block';
    switchTab('tab-result');
    toast('🎉 Dựng phối cảnh 3D thành công!', 'success');

  } catch (err) {
    if (intervalId) clearInterval(intervalId);
    console.error(err);
    toast(`❌ Lỗi: ${err.message}`, 'error');
  } finally {
    isGeneratingR3d = false;
    toggleLoadingState(false);
    validateForm();
  }
}

// AI Lived-in Reality Generation pipeline
async function startLivedInGeneration() {
  if (isGeneratingLivedIn || !selectedLivedInImageFile) return;

  isGeneratingLivedIn = true;
  validateForm();
  toggleLoadingState(true, 'Đang phân tích không gian phòng...', true);

  let intervalId;

  try {
    const subjectMap = {
      'nam': 'man (adult male)',
      'nữ': 'woman (adult female)',
      'bé trai': 'boy (young male child)',
      'bé gái': 'girl (young female child)'
    };
    const timeMap = {
      'sáng': 'daytime with bright natural light',
      'tối': 'nighttime with cozy warm indoor lighting'
    };

    const engSubject = subjectMap[selectedLivedInSubject] || 'man (adult male)';
    const engTime = timeMap[selectedLivedInTime] || 'daytime';

    // 2. Call /api/interior-prompt to generate AI prompt
    const formData = new FormData();
    formData.append('image', selectedLivedInImageFile);
    formData.append('roomType', 'lived-in room');
    formData.append('colorPalette', 'original colors');
    formData.append('designStyle', 'Thực tế sinh hoạt (Lived-in)');
    formData.append('subject', engSubject);
    formData.append('time', engTime);

    const promptRes = await fetch(`${window.API || ''}/api/interior-prompt`, { method: 'POST', body: formData });
    const promptData = await promptRes.json();
    
    if (promptData.error) throw new Error(promptData.error);
    const finalPrompt = promptData.prompt;
    $('#resultPrompt').value = finalPrompt;

    toggleLoadingState(true, 'Đang tải ảnh hiện trạng lên máy chủ...', true);

    // 3. Upload source image via upload-image API
    const uploadFormData = new FormData();
    uploadFormData.append('image', selectedLivedInImageFile);

    const uploadRes = await fetch(`${window.API || ''}/api/upload-image`, { method: 'POST', body: uploadFormData });
    const uploadData = await uploadRes.json();
    
    if (uploadData.error) throw new Error(uploadData.error);
    const mediaId = uploadData.media?.name;
    if (!mediaId) throw new Error('Không thể upload ảnh gốc lên Cloud.');

    toggleLoadingState(true, 'AI đang dựng phối cảnh sinh hoạt...', true);

    // 4. Submit Task to Image-to-Image API (supports parallel tasks for quantity > 1)
    const outputRatioVal = $('#livedInRatio')?.value || 'ORIGINAL';
    const aiModel = $('#aiModel')?.value || 'interior_v2';
    const quantity = parseInt($('#livedInQuantity')?.value) || 1;

    let outputRatio = outputRatioVal;
    if (outputRatioVal === 'ORIGINAL') {
      outputRatio = await getImageClosestRatio(selectedLivedInImageFile);
      console.log('Original ratio closest match for Lived-in:', outputRatio);
    }

    const taskPromises = [];
    for (let q = 0; q < quantity; q++) {
      taskPromises.push((async () => {
        const taskRes = await fetch(`${window.API || ''}/api/image-to-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: finalPrompt,
            quantity: 1, // Enforce 1
            ratio: outputRatio,
            model: aiModel,
            mediaId: mediaId
          })
        });
        const taskData = await taskRes.json();
        if (taskData.error) throw new Error(taskData.error);
        const taskId = taskData.taskid || taskData.taskId;
        if (!taskId) throw new Error('Không nhận được mã tiến trình tạo ảnh.');
        return taskId;
      })());
    }

    const taskIds = await Promise.all(taskPromises);

    // 5. Poll task status in parallel
    let elapsedSeconds = 0;
    intervalId = setInterval(() => {
      elapsedSeconds += 5;
      toggleLoadingState(true, `AI đang thi công phối cảnh sinh hoạt... (${elapsedSeconds}s)`, true);
    }, 5000);

    const pollPromises = taskIds.map(taskId => pollGenerationStatus(taskId, () => {}, 60));
    const pollResults = await Promise.all(pollPromises);
    
    clearInterval(intervalId);

    // Combine results
    const results = [];
    pollResults.forEach(r => {
      if (r.result && r.result.length > 0) {
        results.push(...r.result);
      }
    });

    if (results.length === 0) {
      throw new Error('Lỗi đồng bộ kết quả phối cảnh từ server.');
    }

    const resultImageWrapper = $('#resultImageWrapper');
    const resultGridWrapper = $('#resultGridWrapper');

    if (quantity === 1) {
      const resultUrl = results[0]?.fifeUrl;
      if (!resultUrl) throw new Error('Không tìm thấy link ảnh kết quả.');
      
      const proxyUrl = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(resultUrl)}`;
      $('#resultImage').src = proxyUrl;
      $('#btnDownload').href = proxyUrl;
      $('#resultImage').onclick = () => openLightbox(proxyUrl);

      if (resultImageWrapper) resultImageWrapper.style.display = 'block';
      if (resultGridWrapper) resultGridWrapper.style.display = 'none';

      // Save to History
      saveToHistory(proxyUrl, finalPrompt);
    } else {
      if (resultImageWrapper) resultImageWrapper.style.display = 'none';
      if (resultGridWrapper) {
        resultGridWrapper.innerHTML = '';
        resultGridWrapper.style.display = 'grid';

        results.forEach(item => {
          const proxyUrl = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(item.fifeUrl)}`;
          const img = document.createElement('img');
          img.src = proxyUrl;
          img.alt = 'Phối cảnh sinh hoạt';
          img.style.width = '100%';
          img.style.borderRadius = 'var(--radius-md)';
          img.style.cursor = 'pointer';
          img.style.border = '1px solid rgba(255, 255, 255, 0.08)';
          img.style.transition = 'transform 0.2s ease, border-color 0.2s ease';
          img.onmouseenter = () => {
            img.style.transform = 'scale(1.02)';
            img.style.borderColor = 'var(--primary-gold)';
          };
          img.onmouseleave = () => {
            img.style.transform = 'scale(1)';
            img.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          };
          img.onclick = () => openLightbox(proxyUrl);
          resultGridWrapper.appendChild(img);

          // Save each image to history
          saveToHistory(proxyUrl, finalPrompt);
        });
      }
      
      // Default download button to first image
      if (results[0]?.fifeUrl) {
        const firstProxy = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(results[0].fifeUrl)}`;
        $('#btnDownload').href = firstProxy;
      }
    }

    const resultPlaceholder = $('#resultPlaceholder');
    if (resultPlaceholder) resultPlaceholder.style.display = 'none';

    $('#resultSection').style.display = 'block';
    switchTab('tab-result');

    toast('🎉 Tạo phối cảnh sinh hoạt thực tế thành công!', 'success');

  } catch (err) {
    if (intervalId) clearInterval(intervalId);
    console.error(err);
    toast(`❌ Lỗi: ${err.message}`, 'error');
  } finally {
    isGeneratingLivedIn = false;
    toggleLoadingState(false, '', true);
    validateForm();
  }
}

// Poll Task Status
async function pollGenerationStatus(taskId, onTick, maxRetries = 60) {
  for (let i = 0; i < maxRetries; i++) {
    onTick(i * 5);
    await new Promise(r => setTimeout(r, 5000));
    
    const res = await fetch(`${window.API || ''}/api/check-status/${taskId}`);
    const data = await res.json();
    
    if (data.status === 'successfully') return data;
    if (data.status === 'failed') throw new Error(data.message || 'Tạo ảnh phối cảnh thất bại.');
  }
  throw new Error('Hết thời gian chờ (Timeout) khi tạo phối cảnh nội thất.');
}

// Toggle Generating State UI
function toggleLoadingState(loading, statusText = '', isLivedIn = false) {
  const btn = isLivedIn ? $('#btnGenerateLivedIn') : $('#btnGenerate');
  if (!btn) return;
  const textNode = btn.querySelector('.btn-text');
  const loadNode = btn.querySelector('.btn-loading');
  const statusNode = btn.querySelector('.loading-status');

  if (loading) {
    btn.setAttribute('disabled', 'true');
    if (textNode) textNode.style.display = 'none';
    if (loadNode) loadNode.style.display = 'inline-flex';
    if (statusNode) statusNode.textContent = statusText;
  } else {
    if (textNode) textNode.style.display = 'inline';
    if (loadNode) loadNode.style.display = 'none';
  }
}

// Lightbox helper
function openLightbox(url) {
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxDownload = $('#lightboxDownload');
  
  if (lightbox && lightboxImg) {
    lightboxImg.src = url;
    if (lightboxDownload) lightboxDownload.href = url;
    lightbox.classList.add('open');
  }
}

// History Management
function saveToHistory(imageUrl, prompt) {
  const history = JSON.parse(localStorage.getItem('banana_interior_history') || '[]');
  history.unshift({
    id: Date.now(),
    imageUrl,
    prompt,
    createdAt: new Date().toISOString()
  });
  
  if (history.length > 24) history.length = 24;
  localStorage.setItem('banana_interior_history', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const container = $('#historyGrid');
  const section = $('#historySection');
  const placeholder = $('#historyPlaceholder');
  if (!container || !section) return;
  
  const history = JSON.parse(localStorage.getItem('banana_interior_history') || '[]');
  if (history.length === 0) {
    section.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';
    return;
  }
  
  if (placeholder) placeholder.style.display = 'none';
  section.style.display = 'block';
  container.innerHTML = history.map(item => `
    <div class="history-item" data-url="${item.imageUrl}" title="${item.prompt}">
      <img src="${item.imageUrl}" alt="Past interior design" loading="lazy">
    </div>
  `).join('');
  
  $$('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      openLightbox(item.dataset.url);
    });
  });
}

// Tab switcher
function switchTab(tabId) {
  $$('.tab-item').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  $$('.tab-content').forEach(content => {
    if (content.id === tabId) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

// Watermark handling
async function downloadWithWatermark(e, imageUrl, filename = 'mkg-interior-design.jpg') {
  if (e) e.preventDefault();
  
  const saved = JSON.parse(localStorage.getItem('banana_settings') || '{}');
  const logo = saved.watermarkLogo || '';
  
  if (!logo) {
    triggerDirectDownload(imageUrl, filename);
    return;
  }
  
  const pos = saved.watermarkPos || 'bottom-right';
  const size = parseFloat(saved.watermarkSize || '0.15');
  const opacity = parseFloat(saved.watermarkOpacity || '0.8');
  
  toast('⏳ Đang áp dụng watermark...', 'info');
  try {
    const watermarkedDataUrl = await generateWatermarkedImage(imageUrl, logo, pos, size, opacity);
    triggerDirectDownload(watermarkedDataUrl, filename);
    toast('🎉 Tải phối cảnh thành công!', 'success');
  } catch (err) {
    console.error('Lỗi watermark:', err);
    toast('⚠️ Lỗi watermark, tải ảnh gốc...', 'error');
    triggerDirectDownload(imageUrl, filename);
  }
}

function triggerDirectDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function generateWatermarkedImage(imageUrl, logoBase64, position, sizePercent, opacity) {
  return new Promise((resolve, reject) => {
    const mainImg = new Image();
    mainImg.crossOrigin = 'anonymous';
    
    mainImg.onload = () => {
      const logoImg = new Image();
      logoImg.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = mainImg.naturalWidth;
        canvas.height = mainImg.naturalHeight;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(mainImg, 0, 0);
        
        const targetWidth = canvas.width * sizePercent;
        const scale = targetWidth / logoImg.naturalWidth;
        const targetHeight = logoImg.naturalHeight * scale;
        
        const marginX = canvas.width * 0.025;
        const marginY = canvas.height * 0.025;
        
        let x = 0;
        let y = 0;
        
        switch (position) {
          case 'top-left':
            x = marginX;
            y = marginY;
            break;
          case 'top-right':
            x = canvas.width - targetWidth - marginX;
            y = marginY;
            break;
          case 'bottom-left':
            x = marginX;
            y = canvas.height - targetHeight - marginY;
            break;
          case 'bottom-right':
          default:
            x = canvas.width - targetWidth - marginX;
            y = canvas.height - targetHeight - marginY;
            break;
        }
        
        ctx.globalAlpha = opacity;
        ctx.drawImage(logoImg, x, y, targetWidth, targetHeight);
        ctx.globalAlpha = 1.0;
        
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      logoImg.onerror = () => reject(new Error('Failed to load logo image'));
      logoImg.src = logoBase64;
    };
    mainImg.onerror = () => reject(new Error('Failed to load main image'));
    mainImg.src = imageUrl;
  });
}

// Quotation & Invoice Generation Logic
let quoteRows = [];

function initQuotation() {
  const btnCreateQuote = $('#btnCreateQuote');
  const btnLightboxCreateQuote = $('#lightboxCreateQuote');
  const btnAddRow = $('#btnAddQuoteRow');
  const btnPrint = $('#btnPrintQuote');
  const btnDownloadImg = $('#btnDownloadQuoteImg');
  const discountInput = $('#quoteDiscount');
  
  const inputsToSync = [
    'quoteCustomerName', 'quoteCustomerPhone', 'quoteCustomerAddress',
    'quoteDiscount', 'quoteNotes'
  ];
  
  inputsToSync.forEach(id => {
    $(`#${id}`)?.addEventListener('input', updateInvoicePreview);
  });

  btnCreateQuote?.addEventListener('click', () => {
    const imgUrl = $('#resultImage').src;
    if (imgUrl) openQuotationModal(imgUrl);
  });

  btnLightboxCreateQuote?.addEventListener('click', () => {
    const imgUrl = $('#lightboxImg').src;
    if (imgUrl) {
      $('#lightbox').classList.remove('open');
      openQuotationModal(imgUrl);
    }
  });

  btnAddRow?.addEventListener('click', () => {
    addQuoteRow();
  });

  btnPrint?.addEventListener('click', () => {
    window.print();
  });

  btnDownloadImg?.addEventListener('click', downloadQuotationAsImage);
  
  discountInput?.addEventListener('input', () => {
    calculateQuoteTotals();
  });
}

function openQuotationModal(imageUrl) {
  const saved = JSON.parse(localStorage.getItem('banana_settings') || '{}');
  
  // Setup company fields
  $('#invCompanyName').textContent = saved.companyName || 'CÔNG TY NỘI THẤT MKG';
  
  const profileEl = $('#invCompanyProfile');
  if (saved.companyProfile) {
    profileEl.textContent = saved.companyProfile;
    profileEl.style.display = 'block';
  } else {
    profileEl.style.display = 'none';
  }
  
  const repRow = $('#invCompanyRepRow');
  const repVal = $('#invCompanyRep');
  if (saved.companyRep) {
    repVal.textContent = saved.companyRep;
    repRow.style.display = 'block';
  } else {
    repRow.style.display = 'none';
  }
  
  // Signature settings
  $('#invSignRep').textContent = saved.companyRep || 'Đại diện MKG';

  // Bank Info Block
  const paymentBlock = $('#invPaymentInfoBlock');
  const bankRow = $('#invBankInfoRow');
  const bankVal = $('#invBankInfo');
  const termsRow = $('#invPaymentTermsRow');
  const termsVal = $('#invPaymentTerms');
  
  if (saved.bankInfo || saved.paymentTerms) {
    paymentBlock.style.display = 'block';
    if (saved.bankInfo) {
      bankVal.textContent = saved.bankInfo;
      bankRow.style.display = 'block';
    } else {
      bankRow.style.display = 'none';
    }
    if (saved.paymentTerms) {
      termsVal.textContent = saved.paymentTerms;
      termsRow.style.display = 'block';
    } else {
      termsRow.style.display = 'none';
    }
  } else {
    paymentBlock.style.display = 'none';
  }
  
  // Set logo
  const invLogo = $('#invoiceLogo');
  const logoPlaceholder = $('#invoiceLogoPlaceholder');
  if (saved.watermarkLogo && invLogo && logoPlaceholder) {
    invLogo.src = saved.watermarkLogo;
    invLogo.style.display = 'block';
    logoPlaceholder.style.display = 'none';
  } else if (invLogo && logoPlaceholder) {
    invLogo.src = '';
    invLogo.style.display = 'none';
    logoPlaceholder.style.display = 'block';
  }

  // Set design preview image
  const invoiceDesignImg = $('#invoiceDesignImg');
  if (invoiceDesignImg) {
    invoiceDesignImg.src = imageUrl;
  }

  // Set meta date
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  $('#invDate').textContent = dateStr;
  
  // Set invoice number
  const randNum = Math.floor(100 + Math.random() * 900);
  const invNoStr = `BG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${randNum}`;
  $('#invNo').textContent = invNoStr;

  // Clear rows
  quoteRows = [];
  
  // Determine interior type & pricing defaults
  const typeObj = INTERIOR_TYPES.find(t => t.id === selectedInteriorType) || INTERIOR_TYPES[0];
  const defaultPrice = 2800000; // 2.8 million default
  
  // Add first default item row based on room type selection
  quoteRows.push({
    id: Date.now(),
    name: `Thi công nội thất trọn gói ${typeObj.name}`,
    width: 1.0,
    height: 1.0,
    price: defaultPrice,
    isArea: true
  });

  renderQuoteRows();
  switchTab('tab-quote');
  
  // Reset customer inputs
  $('#quoteCustomerName').value = '';
  $('#quoteCustomerPhone').value = '';
  $('#quoteCustomerAddress').value = '';
  $('#quoteDiscount').value = '0';
  $('#quoteNotes').value = 'Báo giá đã bao gồm chi phí thiết kế 3D, vận chuyển và thi công lắp đặt nội thất hoàn thiện tại công trình.';
  
  $('#invCustName').textContent = '';
  $('#invCustPhone').textContent = '';
  $('#invCustAddress').textContent = '';
  $('#invSignCust').textContent = '';
  
  updateInvoicePreview();
}

function renderQuoteRows() {
  const tbody = $('#quoteTableBody');
  if (!tbody) return;

  tbody.innerHTML = quoteRows.map((row, index) => {
    return `
      <tr data-id="${row.id}">
        <td>
          <input type="text" class="row-name" value="${row.name}" placeholder="Hạng mục thi công">
        </td>
        <td>
          <select class="row-type" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; color: #fff; padding: 6px; font-size: 11.5px; width: 100%; outline: none; cursor: pointer;">
            <option value="m2" ${row.isArea ? 'selected' : ''}>m²</option>
            <option value="ngang" ${!row.isArea ? 'selected' : ''}>cái / mét dài</option>
          </select>
        </td>
        <td>
          <input type="number" class="row-width" value="${row.width}" step="0.1" style="text-align: center;">
        </td>
        <td>
          <input type="number" class="row-height" value="${row.height}" step="0.1" style="text-align: center;" ${row.isArea ? '' : 'disabled'}>
        </td>
        <td>
          <input type="text" class="row-price" value="${formatNumberInput(row.price)}" placeholder="Đơn giá" style="text-align: right;">
        </td>
        <td style="text-align: right; font-weight: 600;" class="row-total">
          0 VND
        </td>
        <td style="text-align: center;">
          ${index > 0 ? `<button type="button" class="btn-delete-row" onclick="deleteQuoteRow(${row.id})">✕</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  // Attach input event listeners to row inputs for live updates
  tbody.querySelectorAll('tr').forEach(tr => {
    const id = parseInt(tr.dataset.id);
    const row = quoteRows.find(r => r.id === id);

    const nameInput = tr.querySelector('.row-name');
    const widthInput = tr.querySelector('.row-width');
    const heightInput = tr.querySelector('.row-height');
    const priceInput = tr.querySelector('.row-price');
    const typeSelect = tr.querySelector('.row-type');

    if (nameInput) {
      nameInput.addEventListener('input', () => {
        row.name = nameInput.value;
        calculateQuoteTotals();
      });
    }
    if (widthInput) {
      widthInput.addEventListener('input', () => {
        row.width = parseFloat(widthInput.value) || 0;
        calculateQuoteTotals();
      });
    }
    if (heightInput) {
      heightInput.addEventListener('input', () => {
        row.height = parseFloat(heightInput.value) || 0;
        calculateQuoteTotals();
      });
    }
    if (priceInput) {
      priceInput.addEventListener('input', () => {
        row.price = parseShorthandPrice(priceInput.value);
        calculateQuoteTotals();
      });
      priceInput.addEventListener('blur', () => {
        priceInput.value = formatNumberInput(row.price);
      });
    }
    if (typeSelect) {
      typeSelect.addEventListener('change', () => {
        row.isArea = (typeSelect.value === 'm2');
        if (heightInput) {
          heightInput.disabled = !row.isArea;
        }
        calculateQuoteTotals();
      });
    }
  });

  calculateQuoteTotals();
}

function addQuoteRow() {
  const defaultPrice = 2500000;
  
  quoteRows.push({
    id: Date.now(),
    name: 'Hạng mục nội thất bổ sung',
    width: 1.0,
    height: 1.0,
    price: defaultPrice,
    isArea: true
  });
  renderQuoteRows();
}

window.deleteQuoteRow = function(id) {
  quoteRows = quoteRows.filter(r => r.id !== id);
  renderQuoteRows();
};

function calculateQuoteTotals() {
  let subtotal = 0;
  
  $$('#quoteTableBody tr').forEach(tr => {
    const id = parseInt(tr.dataset.id);
    const row = quoteRows.find(r => r.id === id);
    if (!row) return;

    let rowTotal = 0;
    if (row.isArea) {
      rowTotal = row.width * row.height * row.price;
    } else {
      rowTotal = row.width * row.price;
    }
    
    rowTotal = Math.round(rowTotal);
    tr.querySelector('.row-total').textContent = formatVND(rowTotal);
    subtotal += rowTotal;
  });

  const discount = parseInt($('#quoteDiscount').value) || 0;
  const total = Math.max(0, subtotal - discount);

  $('#quoteSubtotal').textContent = formatVND(subtotal);
  $('#quoteTotal').textContent = formatVND(total);

  // Sync to printable invoice preview elements
  $('#invSubtotal').textContent = formatVND(subtotal);
  $('#invDiscount').textContent = formatVND(discount);
  $('#invTotal').textContent = formatVND(total);

  updateInvoiceTablePreview();
}

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace('₫', 'VND');
}

function updateInvoiceTablePreview() {
  const printBody = $('#invoiceTableBody');
  if (!printBody) return;

  printBody.innerHTML = quoteRows.map(row => {
    let dimStr = '';
    let lineTotal = 0;
    
    if (row.isArea) {
      dimStr = `${row.width.toFixed(1)}m × ${row.height.toFixed(1)}m (${(row.width * row.height).toFixed(2)} m²)`;
      lineTotal = row.width * row.height * row.price;
    } else {
      dimStr = `${row.width.toFixed(1)} m dài / cái`;
      lineTotal = row.width * row.price;
    }

    return `
      <tr>
        <td>
          <div style="font-weight: 600; color: #1a1a1a;">${row.name}</div>
          <div style="font-size: 9.5px; color: #666; margin-top: 2px;">Đơn vị tính: ${dimStr}</div>
        </td>
        <td style="text-align: center;">${row.width.toFixed(1)}</td>
        <td style="text-align: center;">${row.isArea ? row.height.toFixed(1) : '-'}</td>
        <td style="text-align: right;">${formatVND(row.price)}</td>
        <td style="text-align: right; font-weight: 600; color: #1a1a1a;">${formatVND(Math.round(lineTotal))}</td>
      </tr>
    `;
  }).join('');
}

function updateInvoicePreview() {
  const custName = $('#quoteCustomerName').value || 'Nguyễn Văn A';
  $('#invCustName').textContent = custName;
  $('#invCustPhone').textContent = $('#quoteCustomerPhone').value || '090.xxx.xxxx';
  $('#invCustAddress').textContent = $('#quoteCustomerAddress').value || '123 Nguyễn Thị Minh Khai, Q.3, TP.HCM';
  $('#invSignCust').textContent = custName;
  
  $('#invNotes').textContent = $('#quoteNotes').value || '';
}

// Convert quotation to image A4 canvas draw
function downloadQuotationAsImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1697;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  toast('⏳ Đang kết xuất báo giá dạng ảnh...', 'info');

  const saved = JSON.parse(localStorage.getItem('banana_interior_settings') || '{}');

  const logoImg = new Image();
  const designImg = new Image();
  
  logoImg.crossOrigin = 'anonymous';
  designImg.crossOrigin = 'anonymous';

  let imagesLoaded = 0;
  const totalImagesNeeded = (saved.watermarkLogo ? 1 : 0) + 1;

  const onImageLoaded = () => {
    imagesLoaded++;
    if (imagesLoaded === totalImagesNeeded) {
      drawAllOnCanvas(canvas, ctx, logoImg, designImg, saved);
    }
  };

  logoImg.onload = onImageLoaded;
  logoImg.onerror = () => {
    console.warn('Failed to load logo image for canvas export');
    onImageLoaded();
  };

  designImg.onload = onImageLoaded;
  designImg.onerror = () => {
    toast('⚠️ Lỗi tải ảnh phối cảnh thiết kế', 'error');
    onImageLoaded();
  };

  if (saved.watermarkLogo) {
    logoImg.src = saved.watermarkLogo;
  }
  designImg.src = $('#invoiceDesignImg').src;
}

function drawAllOnCanvas(canvas, ctx, logoImg, designImg, saved) {
  const drawText = (text, x, y, options = {}) => {
    ctx.fillStyle = options.color || '#1b1b22';
    const italicPrefix = options.italic ? 'italic ' : '';
    const boldPrefix = options.bold ? 'bold ' : '';
    ctx.font = `${italicPrefix}${boldPrefix}${options.size || 16}px Arial, sans-serif`;
    ctx.textAlign = options.align || 'left';
    ctx.fillText(text, x, y);
  };

  // Header Logo
  if (saved.watermarkLogo && logoImg.naturalWidth) {
    const maxLogoHeight = 70;
    const scale = maxLogoHeight / logoImg.naturalHeight;
    const logoW = logoImg.naturalWidth * scale;
    ctx.drawImage(logoImg, 60, 60, logoW, maxLogoHeight);
  } else {
    drawText('MKG DESIGN', 60, 100, { size: 30, bold: true, color: '#cda869' });
  }

  // Company Info
  const repName = (saved.companyRep || '').trim();
  const profileText = (saved.companyProfile || '').trim();
  
  drawText(saved.companyName || 'CÔNG TY NỘI THẤT MKG', 1140, 80, { size: 18, bold: true, color: '#cda869', align: 'right' });
  let currentY = 105;
  
  if (profileText) {
    const profileLines = profileText.split('\n');
    profileLines.forEach(line => {
      drawText(line, 1140, currentY, { size: 14, color: '#555555', align: 'right' });
      currentY += 22;
    });
  }
  
  if (repName) {
    drawText(`Người đại diện: ${repName}`, 1140, currentY, { size: 14, bold: true, color: '#333333', align: 'right' });
    currentY += 22;
  }

  // Divider Line
  const grad = ctx.createLinearGradient(60, 0, 1140, 0);
  grad.addColorStop(0, '#cda869');
  grad.addColorStop(1, '#1b1b22');
  ctx.fillStyle = grad;
  ctx.fillRect(60, currentY + 30, 1080, 4);

  // Title
  drawText('BÁO GIÁ THIẾT KẾ & THI CÔNG NỘI THẤT', 600, currentY + 95, { size: 28, bold: true, align: 'center', color: '#1a1a1a' });

  // Customer Info Box
  const boxY = currentY + 130;
  ctx.fillStyle = '#fdfbf7';
  ctx.strokeStyle = '#f2e9dc';
  ctx.lineWidth = 1;
  
  const drawRoundedRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  drawRoundedRect(60, boxY, 1080, 120, 8);

  const custName = $('#quoteCustomerName').value || 'Nguyễn Văn A';
  const custPhone = $('#quoteCustomerPhone').value || '090.xxx.xxxx';
  const custAddr = $('#quoteCustomerAddress').value || '123 Nguyễn Thị Minh Khai, Q.3, TP.HCM';
  
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const invNoStr = $('#invNo').textContent;

  drawText(`Khách hàng: ${custName}`, 90, boxY + 35, { size: 15, bold: true });
  drawText(`Điện thoại: ${custPhone}`, 90, boxY + 65, { size: 14 });
  drawText(`Địa chỉ công trình: ${custAddr}`, 90, boxY + 95, { size: 14 });

  drawText(`Ngày lập: ${dateStr}`, 1110, boxY + 45, { size: 14, align: 'right' });
  drawText(`Số báo giá: ${invNoStr}`, 1110, boxY + 75, { size: 14, bold: true, align: 'right' });

  // Design Image Preview Box
  const photoY = boxY + 150;
  drawText('📸 Phối cảnh thiết kế minh họa:', 60, photoY + 20, { size: 14, bold: true, color: '#555555' });
  
  ctx.fillStyle = '#fafafa';
  ctx.strokeStyle = '#dddddd';
  drawRoundedRect(60, photoY + 35, 1080, 420, 8);
  
  if (designImg.naturalWidth) {
    const maxW = 1060;
    const maxH = 400;
    const imgRatio = designImg.naturalWidth / designImg.naturalHeight;
    const boxRatio = maxW / maxH;
    
    let drawW, drawH;
    if (imgRatio > boxRatio) {
      drawW = maxW;
      drawH = maxW / imgRatio;
    } else {
      drawH = maxH;
      drawW = maxH * imgRatio;
    }
    
    const drawX = 60 + (maxW - drawW) / 2 + 10;
    const drawY = photoY + 35 + (maxH - drawH) / 2 + 10;
    
    ctx.drawImage(designImg, drawX, drawY, drawW - 20, drawH - 20);
  }

  // Items Table
  const tableY = photoY + 490;
  ctx.fillStyle = '#f5f5f7';
  ctx.fillRect(60, tableY, 1080, 40);
  ctx.strokeStyle = '#dddddd';
  ctx.lineWidth = 1;
  ctx.strokeRect(60, tableY, 1080, 40);

  drawText('Hạng mục / Chi tiết thi công', 80, tableY + 26, { size: 14, bold: true, color: '#333' });
  drawText('K.Lượng', 580, tableY + 26, { size: 14, bold: true, color: '#333', align: 'center' });
  drawText('Cao (m)', 700, tableY + 26, { size: 14, bold: true, color: '#333', align: 'center' });
  drawText('Đơn giá', 880, tableY + 26, { size: 14, bold: true, color: '#333', align: 'right' });
  drawText('Thành tiền', 1120, tableY + 26, { size: 14, bold: true, color: '#333', align: 'right' });

  let rowY = tableY + 40;
  let subtotal = 0;

  quoteRows.forEach(row => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(60, rowY, 1080, 50);
    ctx.strokeRect(60, rowY, 1080, 50);

    drawText(row.name, 80, rowY + 22, { size: 14, bold: true });
    
    let dimStr = '';
    let lineTotal = 0;
    if (row.isArea) {
      dimStr = `Đơn vị tính: ${row.width.toFixed(1)}m × ${row.height.toFixed(1)}m (${(row.width * row.height).toFixed(2)}m2)`;
      lineTotal = row.width * row.height * row.price;
    } else {
      dimStr = `Đơn vị tính: ${row.width.toFixed(1)} m dài / cái`;
      lineTotal = row.width * row.price;
    }
    lineTotal = Math.round(lineTotal);
    subtotal += lineTotal;

    drawText(dimStr, 80, rowY + 42, { size: 11, color: '#666' });
    drawText(row.width.toFixed(1), 580, rowY + 30, { size: 14, align: 'center' });
    drawText(row.isArea ? row.height.toFixed(1) : '-', 700, rowY + 30, { size: 14, align: 'center' });
    drawText(formatVND(row.price), 880, rowY + 30, { size: 14, align: 'right' });
    drawText(formatVND(lineTotal), 1120, rowY + 30, { size: 14, bold: true, align: 'right' });

    rowY += 50;
  });

  // Totals Box
  const discount = parseInt($('#quoteDiscount').value) || 0;
  const total = Math.max(0, subtotal - discount);

  const totalY = rowY + 20;
  drawText('Tạm tính:', 850, totalY, { size: 14, color: '#555' });
  drawText(formatVND(subtotal), 1120, totalY, { size: 14, align: 'right', color: '#333' });

  drawText('Giảm giá:', 850, totalY + 25, { size: 14, color: '#555' });
  drawText(`- ${formatVND(discount)}`, 1120, totalY + 25, { size: 14, align: 'right', color: '#e53e3e' });

  ctx.strokeStyle = '#dddddd';
  ctx.beginPath();
  ctx.moveTo(850, totalY + 38);
  ctx.lineTo(1120, totalY + 38);
  ctx.stroke();

  drawText('Tổng cộng thanh toán:', 850, totalY + 60, { size: 16, bold: true, color: '#cda869' });
  drawText(formatVND(total), 1120, totalY + 60, { size: 16, bold: true, align: 'right', color: '#cda869' });

  // Footer Block
  const footerY = totalY + 110;
  ctx.strokeStyle = '#dddddd';
  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.moveTo(60, footerY);
  ctx.lineTo(1140, footerY);
  ctx.stroke();
  ctx.setLineDash([]); 

  // Payment terms & bank
  const bankDetails = (saved.bankInfo || '').trim();
  const payTerms = (saved.paymentTerms || '').trim();
  const notesText = ($('#quoteNotes')?.value || '').trim();
  const notesLines = notesText ? notesText.split('\n') : [];

  let noteOffset = footerY + 35;
  
  if (bankDetails || payTerms) {
    drawText('💳 THANH TOÁN & ĐIỀU KHOẢN', 60, noteOffset, { size: 14, bold: true, color: '#cda869' });
    noteOffset += 25;
    
    if (bankDetails) {
      drawText(`Hình thức thanh toán: ${bankDetails}`, 60, noteOffset, { size: 12, color: '#555' });
      noteOffset += 22;
    }
    
    if (payTerms) {
      drawText(`Điều khoản tạm ứng: ${payTerms}`, 60, noteOffset, { size: 12, color: '#555' });
      noteOffset += 22;
    }
    
    noteOffset += 5;
  }
  
  notesLines.forEach(line => {
    drawText(line, 60, noteOffset, { size: 11, color: '#777777', italic: true });
    noteOffset += 18;
  });

  // Signatures
  drawText('Khách hàng', 820, footerY + 45, { size: 13, bold: true, color: '#444', align: 'center' });
  drawText('(Ký và ghi rõ họ tên)', 820, footerY + 65, { size: 11, color: '#777', align: 'center' });
  drawText(custName, 820, footerY + 140, { size: 14, bold: true, color: '#1a1a1a', align: 'center' });

  drawText('Đại diện bán hàng', 1040, footerY + 45, { size: 13, bold: true, color: '#444', align: 'center' });
  drawText('(Ký và ghi rõ họ tên)', 1040, footerY + 65, { size: 11, color: '#777', align: 'center' });
  drawText(repName, 1040, footerY + 140, { size: 14, bold: true, color: '#1a1a1a', align: 'center' });

  // Download
  const dataURL = canvas.toDataURL('image/jpeg', 0.95);
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = `bao-gia-${custName.replace(/\s+/g, '-').toLowerCase()}-${invNoStr.toLowerCase()}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast('🎉 Đã tải ảnh báo giá thành công!', 'success');
}

// Settings Load & Save Mechanics
function loadSettings() {
  const localSettings = JSON.parse(localStorage.getItem('banana_settings') || '{}');
  
  // Set to controls
  if (localSettings.watermarkPos) $('#watermarkPosition').value = localSettings.watermarkPos;
  if (localSettings.watermarkSize) $('#watermarkSize').value = localSettings.watermarkSize;
  if (localSettings.watermarkOpacity) $('#watermarkOpacity').value = localSettings.watermarkOpacity;

  if (localSettings.watermarkLogo) {
    const preview = $('#watermarkLogoPreview');
    const container = $('#watermarkPreviewContainer');
    const removeBtn = $('#btnRemoveWatermark');
    
    if (preview && container && removeBtn) {
      preview.src = localSettings.watermarkLogo;
      container.style.display = 'flex';
      removeBtn.style.display = 'block';
    }
  }

  // Load from PocketBase cloud sync to check for updates
  syncSettingsFromCloud();
}

async function syncSettingsFromCloud() {
  try {
    const res = await fetch(`${window.API || ''}/api/pb-load?key=settings`);
    if (!res.ok) return;
    const cloud = await res.json();
    if (!cloud || !cloud.value) return;
    
    const local = JSON.parse(localStorage.getItem('banana_settings') || '{}');
    const merged = { ...local, ...cloud.value };
    localStorage.setItem('banana_settings', JSON.stringify(merged));
    
    // Refresh controls
    if (merged.watermarkPos) $('#watermarkPosition').value = merged.watermarkPos;
    if (merged.watermarkSize) $('#watermarkSize').value = merged.watermarkSize;
    if (merged.watermarkOpacity) $('#watermarkOpacity').value = merged.watermarkOpacity;

    if (merged.watermarkLogo) {
      const preview = $('#watermarkLogoPreview');
      const container = $('#watermarkPreviewContainer');
      const removeBtn = $('#btnRemoveWatermark');
      if (preview && container && removeBtn) {
        preview.src = merged.watermarkLogo;
        container.style.display = 'flex';
        removeBtn.style.display = 'block';
      }
    }
  } catch (err) {
    console.warn('Cannot sync settings from Cloud:', err);
  }
}

async function saveSettings() {
  const statusSpan = $('#settingsStatus');
  if (statusSpan) {
    statusSpan.textContent = '⏳ Đang lưu...';
    statusSpan.className = 'settings-status';
  }

  const currentLogo = $('#watermarkLogoPreview').src;
  const oldSettings = JSON.parse(localStorage.getItem('banana_settings') || '{}');

  const currentSettings = {
    ...oldSettings,
    watermarkLogo: currentLogo.startsWith('data:') ? currentLogo : (oldSettings.watermarkLogo || ''),
    watermarkPos: $('#watermarkPosition').value,
    watermarkSize: $('#watermarkSize').value,
    watermarkOpacity: $('#watermarkOpacity').value
  };

  localStorage.setItem('banana_settings', JSON.stringify(currentSettings));

  // Sync to cloud
  try {
    const res = await fetch(`${window.API || ''}/api/pb-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'settings', value: currentSettings })
    });
    
    if (res.ok) {
      if (statusSpan) {
        statusSpan.textContent = '✅ Đã lưu và đồng bộ!';
        statusSpan.className = 'settings-status success';
      }
      toast('💾 Đã lưu cấu hình thành công!', 'success');
    } else {
      throw new Error('Save to PocketBase failed');
    }
  } catch (err) {
    console.error(err);
    if (statusSpan) {
      statusSpan.textContent = '⚠️ Đã lưu offline (PB lỗi)';
      statusSpan.className = 'settings-status error';
    }
    toast('⚠️ Không thể đồng bộ lên Cloud, đã lưu tạm offline.', 'warning');
  }
}

// Logo upload helper
function handleWatermarkLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = event => {
    const preview = $('#watermarkLogoPreview');
    const container = $('#watermarkPreviewContainer');
    const removeBtn = $('#btnRemoveWatermark');
    
    if (preview && container && removeBtn) {
      preview.src = event.target.result;
      container.style.display = 'flex';
      removeBtn.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
}

function removeWatermarkLogo() {
  $('#watermarkLogoInput').value = '';
  const preview = $('#watermarkLogoPreview');
  const container = $('#watermarkPreviewContainer');
  const removeBtn = $('#btnRemoveWatermark');
  
  if (preview && container && removeBtn) {
    preview.src = '';
    container.style.display = 'none';
    removeBtn.style.display = 'none';
  }
}

// General UI Helpers
function toast(message, type = 'info') {
  // Create toast container if not exists
  let container = $('#toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; flex-direction: column; gap: 8px; pointer-events: none;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;
  toast.style.cssText = `
    background: rgba(15, 15, 25, 0.95);
    border: 1px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : 'rgba(255,255,255,0.1)'};
    color: #fff;
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 13px;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideInUp 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  `;
  
  let emoji = 'ℹ️';
  if (type === 'success') emoji = '✅';
  if (type === 'error') emoji = '❌';
  if (type === 'warning') emoji = '⚠️';
  
  toast.innerHTML = `<span>${emoji}</span><span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    container.removeChild(toast);
  }, 3000);
}

// Price Input Helpers
function formatNumberInput(num) {
  return new Intl.NumberFormat('vi-VN').format(num);
}

function parseShorthandPrice(val) {
  let cleanVal = val.replace(/[^0-9kKmM.đđ]/g, '');
  if (!cleanVal) return 0;
  
  // Shorthands like 2m -> 2,000,000, 450k -> 450,000
  let multiplier = 1;
  if (/[kK]/.test(cleanVal)) {
    multiplier = 1000;
    cleanVal = cleanVal.replace(/[kK]/g, '');
  } else if (/[mM]/.test(cleanVal)) {
    multiplier = 1000000;
    cleanVal = cleanVal.replace(/[mM]/g, '');
  }
  
  const parsed = parseFloat(cleanVal.replace(/\./g, '')) || 0;
  return parsed * multiplier;
}

// Inject CSS styles for Toast
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes slideInUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes fadeOut {
    to { opacity: 0; transform: translateY(-10px); }
  }
`;
document.head.appendChild(styleSheet);


/* ==========================================================================
   Multi-Angle Generator and Inline Rendering Setup
   ========================================================================== */
let maImages = []; // Stores { file, base64 }
let maResult = null; // Stores { scenes: [] }

function handleMaImagesSelection(files) {
  const newFiles = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 2);
  for (const file of newFiles) {
    if (maImages.length >= 2) break;
    const reader = new FileReader();
    reader.onload = (e) => {
      maImages.push({ file, base64: e.target.result });
      renderMaPreview();
    };
    reader.readAsDataURL(file);
  }
}

function renderMaPreview() {
  const grid = $('#maPreviewGrid');
  const placeholder = $('#maPlaceholder');
  if (!grid || !placeholder) return;

  if (maImages.length === 0) {
    placeholder.style.display = 'flex';
    grid.innerHTML = '';
    return;
  }

  placeholder.style.display = 'none';
  grid.innerHTML = maImages.map((img, i) => `
    <div style="position:relative;display:inline-block;z-index:2">
      <img src="${img.base64}" style="width:100px;height:100px;object-fit:cover;border-radius:6px;border:2px solid var(--border)">
      <button type="button" onclick="event.preventDefault(); event.stopPropagation(); window.maRemoveImage(${i})" style="position:absolute;top:-6px;right:-6px;background:var(--danger);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;padding:0;z-index:3;box-shadow:0 2px 4px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;">✕</button>
    </div>
  `).join('');
}

window.maRemoveImage = function(index) {
  maImages.splice(index, 1);
  renderMaPreview();
};

window.maGetImageB64 = function() {
  return (maImages && maImages.length > 0) ? maImages[0].base64 : null;
};

async function startMultiAngleAnalysis() {
  if (maImages.length === 0) {
    toast('⚠️ Vui lòng upload 1-2 ảnh phòng hiện trạng', 'error');
    return;
  }

  const settings = JSON.parse(localStorage.getItem('banana_settings') || '{}');

  const checkboxes = document.querySelectorAll('#maAngleOptions input[type="checkbox"]:checked');
  const angles = Array.from(checkboxes).map(cb => cb.value);
  if (angles.length === 0) {
    toast('⚠️ Vui lòng chọn ít nhất 1 góc camera cần tạo', 'error');
    return;
  }

  const btn = $('#maGenerateBtn');
  setMaBtnLoading(btn, true);
  $('#maOutputSection').style.display = 'none';

  try {
    const formData = new FormData();
    if (settings.openrouterKey) formData.append('openrouterKey', settings.openrouterKey);
    formData.append('angles', JSON.stringify(angles));
    maImages.forEach(img => formData.append('images', img.file));

    const res = await fetch((window.API || '') + '/api/generate-angles', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    maResult = data;
    renderMaResults();
    toast('✅ Đã phân tích xong các góc phối cảnh! Đang bắt đầu tạo ảnh...', 'success');
    
    // Automatically trigger sequential generation
    await runSequentialMultiAngleGeneration();
  } catch (err) {
    console.error(err);
    toast(`❌ Lỗi: ${err.message}`, 'error');
  } finally {
    setMaBtnLoading(btn, false);
  }
}

function renderMaResults() {
  const resultGrid = $('#maResultGrid');
  const outputSection = $('#maOutputSection');
  if (!maResult || !maResult.scenes || !resultGrid || !outputSection) return;

  outputSection.style.display = 'block';

  resultGrid.innerHTML = maResult.scenes.map((scene, i) => `
    <div class="pg-prompt-card" data-index="${i}">
      <div class="prompt-card-header" style="justify-content: space-between; align-items: center; display: flex; width: 100%;">
        <span class="prompt-card-label" style="font-weight: 600; color: var(--text);">🎥 ${scene.angle_name || 'Góc ' + (i+1)}</span>
        <span class="ma-status-badge pending">⏳ Đang chờ...</span>
      </div>
      <div class="prompt-card-body" style="padding-top: 8px;">
        <textarea class="ma-prompt-textarea" style="display: none;">${scene.image_prompt || ''}</textarea>
        <div class="inline-result-zone" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-top: 10px;"></div>
      </div>
    </div>
  `).join('');

  outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function runSequentialMultiAngleGeneration() {
  if (!maResult || !maResult.scenes || maResult.scenes.length === 0) return;

  const cards = $$('#maResultGrid .pg-prompt-card');
  const maQty = parseInt($('#maQuantity')?.value) || 1;
  const maRatio = $('#maRatio')?.value || 'LANDSCAPE';

  // 1. Upload reference image once to get mediaId
  let mediaId = null;
  if (maImages.length > 0) {
    try {
      const firstImg = maImages[0];
      const parts = firstImg.base64.split(',');
      const mime = parts[0].match(/:(.*?);/)[1];
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){ u8arr[n] = bstr.charCodeAt(n); }
      const blob = new File([u8arr], "ma_ref.jpg", {type:mime});

      const formData = new FormData();
      formData.append('image', blob);

      const uploadRes = await fetch(`${window.API || ''}/api/upload-image`, { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (uploadData.error) throw new Error(uploadData.error);
      mediaId = uploadData.media?.name;
    } catch (err) {
      console.error('Error uploading reference image:', err);
      toast('❌ Lỗi tải ảnh gốc lên cloud. Không thể tạo phối cảnh.', 'error');
      return;
    }
  }

  // 2. Loop through scenes sequentially
  for (let i = 0; i < maResult.scenes.length; i++) {
    const scene = maResult.scenes[i];
    const card = cards[i];
    if (!card) continue;

    const statusBadge = card.querySelector('.ma-status-badge');
    const resultZone = card.querySelector('.inline-result-zone');

    if (statusBadge) {
      statusBadge.className = 'ma-status-badge running';
      statusBadge.innerHTML = '<span class="spinner"></span> Đang tạo...';
    }

    try {
      const taskRes = await fetch(`${window.API || ''}/api/image-to-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: scene.image_prompt,
          quantity: maQty,
          ratio: maRatio,
          mediaId: mediaId
        })
      });
      const taskData = await taskRes.json();
      if (taskData.error) throw new Error(taskData.error);
      const taskId = taskData.taskid;
      if (!taskId) throw new Error('Không nhận được mã tiến trình.');

      // Poll task status
      const finalResult = await pollGenerationStatus(taskId, (sec) => {
        if (statusBadge) {
          statusBadge.innerHTML = `<span class="spinner"></span> Đang tạo (${sec}s)...`;
        }
      });

      const results = finalResult?.result || [];
      if (results.length === 0) {
        throw new Error('Lỗi đồng bộ kết quả phối cảnh.');
      }

      // Render results inline
      if (resultZone) {
        resultZone.innerHTML = '';
        results.forEach(item => {
          const proxyUrl = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(item.fifeUrl)}`;
          
          const imgWrap = document.createElement('div');
          imgWrap.className = 'inline-result-img-wrap';
          imgWrap.style.position = 'relative';
          
          const img = document.createElement('img');
          img.src = proxyUrl;
          img.style.width = '100%';
          img.style.borderRadius = '6px';
          img.style.cursor = 'pointer';
          img.onclick = () => openLightbox(proxyUrl);
          
          imgWrap.appendChild(img);
          resultZone.appendChild(imgWrap);
          
          saveToHistory(proxyUrl, scene.image_prompt);
        });
      }

      if (statusBadge) {
        statusBadge.className = 'ma-status-badge success';
        statusBadge.textContent = '✅ Hoàn thành';
      }

    } catch (err) {
      console.error(`Error generating angle ${scene.angle_name}:`, err);
      if (statusBadge) {
        statusBadge.className = 'ma-status-badge error';
        statusBadge.innerHTML = `❌ Lỗi | <button class="btn btn-outline btn-sm" onclick="maRetryAngle(${i})" style="padding:2px 6px; font-size:10px; display:inline-block; margin-left:5px; height:auto; min-height:auto; background:rgba(255,255,255,0.05); color:var(--text); border-color:var(--border);">Tạo lại</button>`;
      }
    }
  }

  toast('🎉 Đã hoàn thành toàn bộ phối cảnh các góc!', 'success');
}

window.maRetryAngle = async function(index) {
  if (!maResult || !maResult.scenes || !maResult.scenes[index]) return;
  const cards = $$('#maResultGrid .pg-prompt-card');
  const card = cards[index];
  if (!card) return;

  const scene = maResult.scenes[index];
  const statusBadge = card.querySelector('.ma-status-badge');
  const resultZone = card.querySelector('.inline-result-zone');
  const maQty = parseInt($('#maQuantity')?.value) || 1;
  const maRatio = $('#maRatio')?.value || 'LANDSCAPE';

  if (statusBadge) {
    statusBadge.className = 'ma-status-badge running';
    statusBadge.innerHTML = '<span class="spinner"></span> Đang tạo lại...';
  }

  try {
    let mediaId = null;
    if (maImages.length > 0) {
      const firstImg = maImages[0];
      const parts = firstImg.base64.split(',');
      const mime = parts[0].match(/:(.*?);/)[1];
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){ u8arr[n] = bstr.charCodeAt(n); }
      const blob = new File([u8arr], "ma_ref.jpg", {type:mime});

      const formData = new FormData();
      formData.append('image', blob);

      const uploadRes = await fetch(`${window.API || ''}/api/upload-image`, { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (uploadData.error) throw new Error(uploadData.error);
      mediaId = uploadData.media?.name;
    }

    const taskRes = await fetch(`${window.API || ''}/api/image-to-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: scene.image_prompt,
        quantity: maQty,
        ratio: maRatio,
        mediaId: mediaId
      })
    });
    const taskData = await taskRes.json();
    if (taskData.error) throw new Error(taskData.error);
    const taskId = taskData.taskid;
    if (!taskId) throw new Error('Không nhận được mã tiến trình.');

    const finalResult = await pollGenerationStatus(taskId, (sec) => {
      if (statusBadge) {
        statusBadge.innerHTML = `<span class="spinner"></span> Đang tạo lại (${sec}s)...`;
      }
    });

    const results = finalResult?.result || [];
    if (results.length === 0) throw new Error('Không có ảnh kết quả.');

    if (resultZone) {
      resultZone.innerHTML = '';
      results.forEach(item => {
        const proxyUrl = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(item.fifeUrl)}`;
        const imgWrap = document.createElement('div');
        imgWrap.className = 'inline-result-img-wrap';
        const img = document.createElement('img');
        img.src = proxyUrl;
        img.style.width = '100%';
        img.style.borderRadius = '6px';
        img.style.cursor = 'pointer';
        img.onclick = () => openLightbox(proxyUrl);
        imgWrap.appendChild(img);
        resultZone.appendChild(imgWrap);
        saveToHistory(proxyUrl, scene.image_prompt);
      });
    }

    if (statusBadge) {
      statusBadge.className = 'ma-status-badge success';
      statusBadge.textContent = '✅ Hoàn thành';
    }
    toast('🎉 Tạo phối cảnh góc nhìn lại thành công!', 'success');
  } catch (err) {
    console.error(err);
    if (statusBadge) {
      statusBadge.className = 'ma-status-badge error';
      statusBadge.innerHTML = `❌ Lỗi | <button class="btn btn-outline btn-sm" onclick="maRetryAngle(${index})" style="padding:2px 6px; font-size:10px; display:inline-block; margin-left:5px; height:auto; min-height:auto; background:rgba(255,255,255,0.05); color:var(--text); border-color:var(--border);">Tạo lại</button>`;
    }
    toast(`❌ Lỗi: ${err.message}`, 'error');
  }
};

function setMaBtnLoading(btn, isLoading) {
  if (!btn) return;
  btn.disabled = isLoading;
  const txt = btn.querySelector('.btn-text');
  const ldg = btn.querySelector('.btn-loading');
  if (txt) txt.style.display = isLoading ? 'none' : 'inline-block';
  if (ldg) ldg.style.display = isLoading ? 'inline-block' : 'none';
}


// ══════════════════════════════════════════════════
// PIPELINE PROGRESS ENGINE
// ══════════════════════════════════════════════════

// Cached pipeline state (survives re-runs)
let pipelineCache = {
  prompt:  null,  // { text, elapsed }
  mediaId: null,  // { id, elapsed }
};

// Step states: 'idle' | 'running' | 'done' | 'error'
function pipelineSetStep(step, state, timeMs, extra) {
  const dot    = $(`#pdot-${step}`);
  const badge  = $(`#pbadge-${step}`);
  const detail = $(`#pdetail-${step}`);
  const time   = $(`#ptime-${step}`);
  const retry  = $(`#pretry-${step}`);

  if (!dot) return;

  // Dot
  dot.className = `pstep-dot ${state === 'idle' ? '' : state}`;

  // Badge
  const labels = { idle: 'Chờ', running: 'Đang chạy...', done: 'Hoàn thành', error: 'Lỗi' };
  badge.textContent = labels[state] || state;
  badge.className   = `pstep-badge ${state === 'idle' ? '' : state}`;

  // Detail panel
  if (state === 'idle') {
    if (detail) detail.style.display = 'none';
    return;
  }
  if (detail) detail.style.display = 'flex';
  if (time && timeMs != null) time.textContent = `Thời gian: ${(timeMs / 1000).toFixed(1)}s`;

  // Extra info (e.g. cached mediaId)
  const cachedEl = $(`#pcached-${step}`);
  if (cachedEl && extra) cachedEl.textContent = extra;

  // Retry button — show only on done/error
  if (retry) retry.style.display = (state === 'done' || state === 'error') ? 'inline-block' : 'none';
}

function pipelineShow() {
  const card = $('#pipelineCard');
  if (card) card.style.display = 'flex';
}

function pipelineReset() {
  pipelineCache.prompt  = null;
  pipelineCache.mediaId = null;
  ['prompt', 'upload', 'generate'].forEach(s => pipelineSetStep(s, 'idle', null, ''));
  const card = $('#pipelineCard');
  if (card) card.style.display = 'none';
}

// Wire retry buttons once DOM ready
function initPipelineButtons() {
  $('#pipelineResetBtn')?.addEventListener('click', () => {
    pipelineReset();
    toast('Pipeline đã reset. Bạn có thể tạo lại từ đầu.', 'info');
  });

  // Retry from step 1 (prompt) — clears all cache
  $('#pretry-prompt')?.addEventListener('click', () => {
    pipelineCache.prompt  = null;
    pipelineCache.mediaId = null;
    ['prompt', 'upload', 'generate'].forEach(s => pipelineSetStep(s, 'idle'));
    runPipeline();
  });

  // Retry from step 2 (upload) — keeps prompt, clears mediaId
  $('#pretry-upload')?.addEventListener('click', () => {
    pipelineCache.mediaId = null;
    pipelineSetStep('upload', 'idle');
    pipelineSetStep('generate', 'idle');
    runPipeline();
  });

  // Retry from step 3 (generate) — keeps both prompt & mediaId
  $('#pretry-generate')?.addEventListener('click', () => {
    pipelineSetStep('generate', 'idle');
    runPipeline();
  });
}

// Main pipeline runner — skips already-cached steps
async function runPipeline() {
  isGenerating = true;
  isGeneratingR3d = true;
  validateForm();
  pipelineShow();

  // Show loading state on button
  const btnText    = $('#btnGenerateText');
  const btnLoading = $('#btnGenerate .btn-loading');
  if (btnText)    btnText.style.display = 'none';
  if (btnLoading) btnLoading.style.display = 'flex';

  const updateStatus = (msg) => {
    const el = $('#mainLoadingStatus');
    if (el) el.textContent = msg;
  };

  try {
    // ── STEP 1: Prompt ──────────────────────
    if (!pipelineCache.prompt) {
      pipelineSetStep('prompt', 'running');
      updateStatus('Đang phân tích ảnh & tạo prompt...');
      const t0 = Date.now();

      let finalPrompt;
      if (designMode === 'keepstyle') {
        // Collect decor options
        const getChecked = id => [...$$(`#${id} input[type="checkbox"]:checked`)].map(e => e.value);
        const outputMode = $(`#r3dOutputMode .pill-btn.active`)?.dataset.value || '3d-photorealistic';
        const lighting   = getChecked('decorLighting');
        const soft       = getChecked('decorSoft');
        const wall       = getChecked('decorWall');

        const fd = new FormData();
        fd.append('image', selectedImageFile);
        fd.append('outputMode', outputMode);
        fd.append('decorLighting', JSON.stringify(lighting));
        fd.append('decorSoft', JSON.stringify(soft));
        fd.append('decorWall', JSON.stringify(wall));

        const res  = await fetch(`${window.API || ''}/api/render3d-prompt`, { method: 'POST', body: fd });
        let data3d;
        try { data3d = await res.json(); } catch { throw new Error(`Server lỗi ${res.status}: ${res.statusText}`); }
        if (!res.ok || data3d?.error) throw new Error(data3d?.error || `Lỗi tạo prompt 3D (${res.status})`);
        finalPrompt = data3d.prompt;
        if (!finalPrompt) throw new Error('Server không trả về prompt hợp lệ.');
      } else {
        // Redesign mode — use interior-prompt
        const interiorType  = selectedInteriorType || 'living-room';
        const colorVal      = selectedColor !== 'custom' ? selectedColor : ($('#customColor')?.value.trim() || selectedColor);
        const styleVal      = selectedStyle || 'modern';
        const fd = new FormData();
        fd.append('image', selectedImageFile);
        fd.append('interiorType', interiorType);
        fd.append('color', colorVal);
        fd.append('style', styleVal);

        const res  = await fetch(`${window.API || ''}/api/interior-prompt`, { method: 'POST', body: fd });
        let data;
        try { data = await res.json(); } catch { throw new Error(`Server lỗi ${res.status}: ${res.statusText}`); }
        if (!res.ok || data?.error) throw new Error(data?.error || `Lỗi tạo prompt (${res.status})`);
        finalPrompt = data.prompt;
        if (!finalPrompt) throw new Error('Server không trả về prompt hợp lệ.');
      }

      const elapsed = Date.now() - t0;
      pipelineCache.prompt = { text: finalPrompt, elapsed };
      pipelineSetStep('prompt', 'done', elapsed, '');
      if ($('#resultPrompt')) $('#resultPrompt').value = finalPrompt;
    } else {
      pipelineSetStep('prompt', 'done', pipelineCache.prompt.elapsed, 'Dùng prompt đã cache');
    }

    // ── STEP 2: Upload ──────────────────────
    if (!pipelineCache.mediaId) {
      pipelineSetStep('upload', 'running');
      updateStatus('Đang upload ảnh lên Cloud...');
      const t0 = Date.now();

      const fd = new FormData();
      fd.append('image', selectedImageFile);
      const res  = await fetch(`${window.API || ''}/api/upload-image`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const mediaId = data.media?.name;
      if (!mediaId) throw new Error('Upload thất bại — không nhận được mediaId.');

      const elapsed = Date.now() - t0;
      pipelineCache.mediaId = { id: mediaId, elapsed };
      pipelineSetStep('upload', 'done', elapsed, `ID: ${mediaId}`);
    } else {
      pipelineSetStep('upload', 'done', pipelineCache.mediaId.elapsed, `Dùng lại: ${pipelineCache.mediaId.id}`);
    }

    // ── STEP 3: Generate ────────────────────
    pipelineSetStep('generate', 'running');
    updateStatus('AI đang tạo ảnh...');
    const t0gen = Date.now();

    const finalPrompt = pipelineCache.prompt.text;
    const mediaId     = pipelineCache.mediaId.id;

    // Get output settings
    const ratioSel = designMode === 'keepstyle' ? $('#r3dRatio') : $('#outputRatio');
    const qtySel   = designMode === 'keepstyle' ? $('#r3dQuantity') : $('#outputQuantity');
    let   outputRatio = ratioSel?.value || 'ORIGINAL';
    const quantity    = parseInt(qtySel?.value) || 1;
    if (outputRatio === 'ORIGINAL') outputRatio = await getImageClosestRatio(selectedImageFile);

    const taskPromises = [];
    for (let q = 0; q < quantity; q++) {
      taskPromises.push((async () => {
        const res  = await fetch(`${window.API || ''}/api/image-to-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: finalPrompt, quantity: 1, ratio: outputRatio, model: 'Nano_Banana_Pro', mediaId })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const taskId = data.taskid || data.taskId;
        if (!taskId) throw new Error('Không nhận được taskId.');
        return taskId;
      })());
    }

    const taskIds    = await Promise.all(taskPromises);
    const pollResults = await Promise.all(taskIds.map(id => pollGenerationStatus(id, () => {}, 60)));

    const results = [];
    pollResults.forEach(r => { if (r.result?.length > 0) results.push(...r.result); });
    if (!results.length) throw new Error('AI không trả về kết quả.');

    const elapsed = Date.now() - t0gen;
    pipelineSetStep('generate', 'done', elapsed);

    // ── Display results ──
    const resultImageWrapper = $('#resultImageWrapper');
    const resultGridWrapper  = $('#resultGridWrapper');

    if (quantity === 1) {
      const proxyUrl = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(results[0]?.fifeUrl)}`;
      $('#resultImage').src = proxyUrl;
      $('#btnDownload').href = proxyUrl;
      $('#resultImage').onclick = () => openLightbox(proxyUrl);
      if (resultImageWrapper) resultImageWrapper.style.display = 'block';
      if (resultGridWrapper)  resultGridWrapper.style.display  = 'none';
      saveToHistory(proxyUrl, finalPrompt);
    } else {
      if (resultImageWrapper) resultImageWrapper.style.display = 'none';
      if (resultGridWrapper) {
        resultGridWrapper.innerHTML = '';
        resultGridWrapper.style.display = 'grid';
        results.forEach(item => {
          const proxyUrl = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(item.fifeUrl)}`;
          const img = document.createElement('img');
          img.src = proxyUrl;
          img.style.cssText = 'width:100%;border-radius:var(--radius-md);cursor:pointer;border:1px solid rgba(255,255,255,0.08);transition:transform 0.2s;';
          img.onmouseenter = () => img.style.transform = 'scale(1.02)';
          img.onmouseleave = () => img.style.transform = '';
          img.onclick = () => openLightbox(proxyUrl);
          resultGridWrapper.appendChild(img);
          saveToHistory(proxyUrl, finalPrompt);
        });
        if (results[0]?.fifeUrl) $('#btnDownload').href = `${window.API || ''}/api/proxy-image?url=${encodeURIComponent(results[0].fifeUrl)}`;
      }
    }

    const placeholder = $('#resultPlaceholder');
    if (placeholder) placeholder.style.display = 'none';
    $('#resultSection').style.display = 'block';
    switchTab('tab-result');
    toast('Tạo ảnh thành công!', 'success');

  } catch (err) {
    console.error(err);
    // Mark the failing step
    ['generate', 'upload', 'prompt'].forEach(s => {
      const badge = $(`#pbadge-${s}`);
      if (badge && badge.classList.contains('running')) {
        pipelineSetStep(s, 'error', null);
      }
    });
    toast(`Lỗi: ${err.message}`, 'error');
  } finally {
    isGenerating = false;
    isGeneratingR3d = false;
    if (btnText)    btnText.style.display = '';
    if (btnLoading) btnLoading.style.display = 'none';
    validateForm();
  }
}
