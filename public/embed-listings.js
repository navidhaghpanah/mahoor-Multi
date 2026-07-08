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

  var FA_DIGITS = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  function faDigits(s) {
    return String(s == null ? '' : s).replace(/[0-9]/g, function (d) { return FA_DIGITS[+d]; });
  }
  function withCommas(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function fmtPrice(n) {
    var num = parseInt(String(n || '').replace(/[^0-9]/g, ''), 10);
    if (!num || num <= 0) return 'توافقی';
    return faDigits(withCommas(num)) + ' تومان';
  }

  function fmtNum(n) {
    var num = parseInt(String(n || '').replace(/[^0-9]/g, ''), 10);
    if (!num) return faDigits('0');
    return faDigits(withCommas(num));
  }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function buildCard(l) {
    // Build image gallery: main cover + scrollable thumbnail strip when multiple images exist
    var imgCount = Array.isArray(l.images) && l.images.length > 0 ? l.images.length : (l.imageUrl ? 1 : 0);
    var imgBase = 'https://app.mahoorrlste.ir/api/listing-image/' + encodeURIComponent(l.id);
    var mainImg = imgCount > 0
      ? '<div style="position:relative;">'
        + '<img src="' + imgBase + '" alt="' + esc(l.title) + '" style="width:100%;height:180px;object-fit:cover;display:block;" loading="lazy" onerror="this.style.display=\'none\'">'
        + (imgCount > 1 ? '<span style="position:absolute;bottom:6px;left:6px;background:rgba(0,0,0,.65);color:#fff;font-size:0.72rem;padding:2px 8px;border-radius:12px;">' + faDigits(imgCount) + ' عکس</span>' : '')
        + '</div>'
      : '<div style="width:100%;height:100px;display:flex;align-items:center;justify-content:center;color:#D4AF37;font-size:2.2rem;">&#127968;</div>';
    var thumbStrip = '';
    if (imgCount > 1) {
      var thumbs = [];
      for (var ti = 1; ti < imgCount; ti++) {
        thumbs.push('<img src="' + imgBase + '?i=' + ti + '" alt="" loading="lazy" style="width:56px;height:48px;object-fit:cover;border-radius:6px;flex-shrink:0;border:1px solid rgba(212,175,55,.25);" onerror="this.style.display=\'none\'">');
      }
      thumbs = thumbs.join('');
      thumbStrip = '<div style="display:flex;gap:5px;padding:5px 8px;overflow-x:auto;background:#071c36;">' + thumbs + '</div>';
    }
    var imgHtml = mainImg + thumbStrip;

    var badgeType = typeLabel(l.deal || l.propType || '');
    var badgeHtml = badgeType
      ? '<span style="background:#D4AF37;color:#030D1E;font-size:0.72rem;font-weight:700;padding:2px 9px;border-radius:4px;display:inline-block;margin-bottom:8px;">' + esc(badgeType) + '</span>'
      : '';

    var details = [];
    if (l.size > 0) details.push('&#128208; ' + fmtNum(l.size) + ' متر');
    if (l.buildingArea > 0) details.push('&#127959; ' + fmtNum(l.buildingArea) + ' متر بنا');
    if (l.beds > 0) details.push('&#128716; ' + faDigits(l.beds) + ' خواب');
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

    // Whole card links to the public listing page; the call button keeps tel: behavior
    var pageUrl = 'https://app.mahoorrlste.ir/p/MH-' + ('0000' + (parseInt(l.id, 10) || 0)).slice(-4);

    return '<div style="background:#0C2C54;border:1px solid rgba(212,175,55,0.2);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;">'
      + '<a href="' + pageUrl + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;display:block;cursor:pointer;">'
      + imgHtml
      + '</a>'
      + '<div style="padding:14px 16px 16px;flex:1;display:flex;flex-direction:column;">'
      + badgeHtml
      + (l.code ? '<span style="float:left;color:#6b7e8f;font-size:0.7rem;font-family:monospace;" dir="ltr">' + esc(l.code) + '</span>' : '')
      + '<a href="' + pageUrl + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;">'
      + '<h3 style="color:#fff;font-size:0.95rem;font-weight:600;margin:0 0 8px;line-height:1.45;clear:both;">' + esc(l.title || 'ملک') + '</h3>'
      + '<p style="color:#D4AF37;font-size:1rem;font-weight:700;margin:0 0 10px;">' + fmtPrice(l.price) + '</p>'
      + detailHtml
      + '</a>'
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

  // Replace any Google Maps embed on the host page with the Neshan office map.
  var NESHAN_IFRAME = 'https://neshan.org/maps/iframe/places/e6b2021f031276677ff2932eb5210ea0#c36.609-52.274-15z-0p/36.608712415328405/52.26866934659323';
  var NESHAN_LINK   = 'https://nshn.ir/e6_bfscK2FHD8-';

  function replaceGoogleMap() {
    var frames = document.querySelectorAll('iframe');
    for (var i = 0; i < frames.length; i++) {
      var src = frames[i].getAttribute('src') || '';
      if (src.indexOf('google.com/maps') !== -1 || src.indexOf('maps.google') !== -1 || src.indexOf('openstreetmap.org') !== -1) {
        var wrap = document.createElement('div');
        wrap.style.cssText = 'border-radius:14px;overflow:hidden;border:1px solid rgba(212,175,55,0.25);direction:rtl;';
        wrap.innerHTML =
          '<iframe title="نقشه دفتر املاک ماهور" src="' + NESHAN_IFRAME + '" '
          + 'style="width:100%;height:' + (frames[i].offsetHeight || 400) + 'px;border:0;display:block;" allowfullscreen loading="lazy"></iframe>'
          + '<a href="' + NESHAN_LINK + '" target="_blank" rel="noopener" '
          + 'style="display:block;text-align:center;background:#0C2C54;color:#D4AF37;padding:12px 0;'
          + 'font-weight:700;font-size:0.9rem;text-decoration:none;font-family:\'Vazirmatn\',\'Tahoma\',sans-serif;">'
          + '🧭 مسیریابی با نشان</a>';
        frames[i].parentNode.replaceChild(wrap, frames[i]);
      }
    }
    // Rewrite Google-Maps links (e.g. مسیریابی buttons) to the Neshan link
    var links = document.querySelectorAll('a[href*="maps.app.goo.gl"], a[href*="google.com/maps"], a[href*="maps.google"], a[href*="goo.gl/maps"]');
    for (var j = 0; j < links.length; j++) {
      links[j].setAttribute('href', NESHAN_LINK);
    }
  }

  // Run immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); replaceGoogleMap(); });
  } else {
    init();
    replaceGoogleMap();
  }
}());
