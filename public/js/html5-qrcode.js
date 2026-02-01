/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
(function () {
  if (typeof Html5QrcodeScanner === 'undefined') return;

  function select2Search($el, term) {
    $el.select2('open');
    const $search = $el.data('select2').dropdown.$search
      || $el.data('select2').selection.$search;
    $search.val(term);
    $search.trigger('input');
  }

  function onScanSuccess(decodedText) {
    if (document.getElementById('html5-qrcode-button-camera-stop')) {
      document.getElementById('html5-qrcode-button-camera-stop').click();
    }
    const $select = $('#barang');
    if ($select.length && typeof $select.select2 === 'function') {
      select2Search($select, decodedText);
    }
  }

  function onScanFailure(error) {
    console.warn('Code scan error:', error);
  }

  var html5QrcodeScanner = null;

  function initQrScanner() {
    var readerEl = document.getElementById('reader');
    if (!readerEl) return;
    if (html5QrcodeScanner) return;
    try {
      html5QrcodeScanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: false,
        },
        false,
      );
      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    } catch (e) {
      console.warn('QR scanner init failed:', e);
      html5QrcodeScanner = null;
    }
  }

  function clearQrScanner() {
    if (html5QrcodeScanner) {
      html5QrcodeScanner.clear().catch(function () {});
      html5QrcodeScanner = null;
    }
  }

  window.stopScan = function () {
    if (document.getElementById('html5-qrcode-button-camera-stop')) {
      document.getElementById('html5-qrcode-button-camera-stop').click();
    }
    clearQrScanner();
  };

  window.addEventListener('beforeunload', function () {
    clearQrScanner();
  });

  if (document.getElementById('add') && typeof $ !== 'undefined') {
    $(document).ready(function () {
      $('#add').off('shown.bs.modal hidden.bs.modal');
      $('#add').on('shown.bs.modal', function () {
        initQrScanner();
      });
      $('#add').on('hidden.bs.modal', function () {
        clearQrScanner();
      });
    });
  }
})();
