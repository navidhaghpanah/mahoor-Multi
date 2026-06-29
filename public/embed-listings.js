(function () {
  'use strict';

  var API = 'https://app.mahoorrlste.ir/api/listings';
  var APP = 'https://app.mahoorrlste.ir';

  var TYPE_LABEL = {
    'apartment': 'آپارتمان', 'آپارتمان': 'آپارتمان',
    'villa': 'ویلا', 'ویلا': 'ویلا',
    'land': 'زمین', 'زمین': 'زمین',
    'commercial': 'تجاری', 'تجاری': 'تجاری',
    'sale': 'فروش', 'فروش': 'فروش',
    'rent': 'اجاره', 'اجاره': 'اجاره',
    'mortgage': 'رهن', 'رهن': 'رهن',
    'presale': 'پیش‌فروش', 'پیش‌فروش': 'پیش‌فروش',
  };

  function typeLabel(v) { return TYPE_LABEL[v] || v || ''; }

  function fmtPrice(n) {
    var num = parseInt(String(n || '').replace(/[^0-9]/g, ''), 10);
    if (!num || num <= 0) return 'توافقی'; // توافقی
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace('.0', '') + ' میلیارد تومان';
    if (num >= 1000000)    return Math.round(num / 1000000) + ' میلیون تومان';
    return num.toLocaleString('fa-IR') + ' تومان';
  }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function buildCard(l) {
    var imgHtml = l.imageUrl
      ? '<img src="' + esc(l.imageUrl) + '" alt="' + esc(l.title) + '" style="width:100%;height:180px;object-fit:cover;display:block;" loading="lazy" onerror="this.style.display=\'none\'">'
      : '<div style="width:100%;height:100px;display:flex;align-items:center;justify-content:center;color:#D4AF37;font-size:2.2rem;">&#127968;</div>';

    var badgeType = typeLabel(l.deal || l.propType || '');
    var badgeHtml = badgeType
      ? '<span style="background:#D4AF37;color:#030D1E;font-size:0.72rem;font-weight:700;padding:2px 9px;border-radius:4px;display:inline-block;margin-bottom:8px;">' + esc(badgeType) + '</span>'
      : '';

    var details = [];
    if (l.size > 0) details.push('&#128208; ' + l.size + ' متر');
    if (l.beds > 0) details.push('&#128716; ' + l.beds + ' خواب');
    if (l.location) details.push('&#128205; ' + esc(l.location));
    var detailHtml = details.length
      ? '<p style="color:#a0b0c0;font-size:0.8rem;margin:0 0 6px;line-height:1.9;">' + details.join(' &nbsp;&middot;&nbsp; ') + '</p>'
      : '';

    var advisorHtml = l.advisorName
      ? '<p style="color:#6b7e8f;font-size:0.78rem;margin:0 0 2px;">&#128100; ' + esc(l.advisorName) + '</p>'
      : '';

    var phone = l.advisorPhone || l.phone || '';
    var callHtml = phone
      ? '<a href="tel:' + esc(phone) + '" style="display:block;width:100%;box-sizing:border-box;background:#D4AF37;color:#030D1E;text-align:center;padding:10px 0;border-radius:8px;font-weight:700;font-size:0.9rem;text-decoration:none;margin-top:14px;">&#128222; تماس با مشاور</a>'
      : '';

    return '<div style="background:#0C2C54;border:1px solid rgba(212,175,55,0.2);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;">'
      + imgHtml
      + '<div style="padding:14px 16px 16px;flex:1;display:flex;flex-direction:column;">'
      + badgeHtml
      + '<h3 style="color:#fff;font-size:0.95rem;font-weight:600;margin:0 0 8px;line-height:1.45;">' + esc(l.title || 'ملک') + '</h3>'
      + '<p style="color:#D4AF37;font-size:1rem;font-weight:700;margin:0 0 10px;">' + fmtPrice(l.price) + '</p>'
      + detailHtml
      + advisorHtml
      + callHtml
      + '</div></div>';
  }

  function buildSection() {
    return '<div style="max-width:1100px;margin:0 auto;padding:0 16px;">'

      // heading
      + '<div style="text-align:center;margin-bottom:36px;">'
      + '<h2 style="color:#D4AF37;font-size:clamp(1.4rem,4vw,2rem);font-weight:700;margin:0 0 8px;letter-spacing:0.02em;">'
      + 'آخرین آگهی‌ها'   // آخرین آگهی‌ها
      + '</h2>'
      + '<p style="color:#a0b0c0;font-size:0.9rem;margin:0;">'
      + 'جدیدترین ملک‌های تأییدشده توسط کارشناسان ماهور'
      + '</p>'
      + '<div style="width:48px;height:3px;background:#D4AF37;border-radius:2px;margin:14px auto 0;"></div>'
      + '</div>'

      // states
      + '<div id="mhl-loading" style="text-align:center;color:#a0b0c0;padding:32px 0;font-size:0.95rem;">'
      + 'در حال بارگذاری آگهی‌ها…'
      + '</div>'
      + '<div id="mhl-error" style="display:none;text-align:center;color:#f87171;padding:24px;font-size:0.9rem;">'
      + 'خطا در دریافت آگهی‌ها. لطفاً صفحه را دوباره بارگذاری کنید.'
      + '</div>'
      + '<div id="mhl-empty" style="display:none;text-align:center;color:#a0b0c0;padding:32px 0;font-size:0.95rem;">'
      + 'در حال حاضر آگهی فعالی موجود نیست.'
      + '</div>'

      // grid
      + '<div id="mhl-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;"></div>'

      // more button
      + '<div id="mhl-more" style="display:none;text-align:center;margin-top:36px;">'
      + '<a href="' + APP + '" target="_blank" rel="noopener" style="'
      + 'display:inline-block;background:transparent;color:#D4AF37;border:1.5px solid #D4AF37;'
      + 'border-radius:10px;padding:12px 32px;font-size:0.95rem;font-weight:600;text-decoration:none;letter-spacing:0.03em;"'
      + ' onmouseover="this.style.background=\'#D4AF37\';this.style.color=\'#030D1E\'"'
      + ' onmouseout="this.style.background=\'transparent\';this.style.color=\'#D4AF37\'">'
      + 'مشاهده همه آگهی‌ها ←'
      + '</a></div>'

      + '</div>'; // inner wrapper
  }

  function init() {
    // Find or create the mount point
    var mount = document.getElementById('mahoor-live-listings');
    if (!mount) {
      mount = document.createElement('section');
      mount.id = 'mahoor-live-listings';
      document.body.appendChild(mount);
    }

    // Apply outer section styles
    mount.style.direction    = 'rtl';
    mount.style.fontFamily   = "'Vazirmatn','Tahoma','Arial',sans-serif";
    mount.style.background   = '#030D1E';
    mount.style.padding      = '48px 0 64px';
    mount.style.boxSizing    = 'border-box';
    mount.style.width        = '100%';

    mount.innerHTML = buildSection();

    // Fetch listings
    fetch(API)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        document.getElementById('mhl-loading').style.display = 'none';
        var list = (data && Array.isArray(data.listings)) ? data.listings : [];
        if (list.length === 0) {
          document.getElementById('mhl-empty').style.display = 'block';
        } else {
          document.getElementById('mhl-grid').innerHTML = list.slice(0, 9).map(buildCard).join('');
          document.getElementById('mhl-more').style.display = 'block';
        }
      })
      .catch(function () {
        document.getElementById('mhl-loading').style.display = 'none';
        document.getElementById('mhl-error').style.display = 'block';
      });
  }

  // Run immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
