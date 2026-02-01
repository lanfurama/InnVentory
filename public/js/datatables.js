/* eslint-disable no-undef */
$(() => {
  const dtButtons = {
    responsive: true,
    autoWidth: false,
    dom:
      "B<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>"
      + "<'row'<'col-sm-12'tr>>"
      + "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
    buttons: [
      {
        extend: 'print',
        customize(win) {
          $(win.document.body).css('height', 'auto').css('min-height', '0');
        },
        exportOptions: {
          stripHtml: false,
          columns: [0, 1, 2, 3, 4, 5, 6],
        },
      },
    ],
    initComplete() {
      $('.buttons-print').html('<i class="fas fa-print"></i> Cetak ');
    },
  };

  if ($('#stokbarang').length) {
    $('#stokbarang').DataTable(dtButtons).buttons().container().appendTo($('#bt').length ? '#bt' : '#stokbarang_wrapper');
  }
  if ($('#barangmasuk').length) {
    $('#barangmasuk').DataTable(dtButtons).buttons().container().appendTo($('#bt').length ? '#bt' : '#barangmasuk_wrapper');
  }
  if ($('#barangkeluar').length) {
    $('#barangkeluar').DataTable(dtButtons).buttons().container().appendTo($('#bt').length ? '#bt' : '#barangkeluar_wrapper');
  }
  if ($('#user').length) {
    $('#user').DataTable({ responsive: true, autoWidth: false });
  }
  if ($('#log').length) {
    $('#log').DataTable({ responsive: true, autoWidth: false });
  }
  if ($('#detailbarangmasuk').length) {
    $('#detailbarangmasuk').DataTable({
      paging: true,
      lengthChange: false,
      searching: false,
      ordering: true,
      info: true,
      autoWidth: false,
      responsive: true,
    });
  }
  if ($('#detailbarangkeluar').length) {
    $('#detailbarangkeluar').DataTable({
      paging: true,
      lengthChange: false,
      searching: false,
      ordering: true,
      info: true,
      autoWidth: false,
      responsive: true,
    });
  }
});
