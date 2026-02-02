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

  if ($('#assetsTable').length) {
    const assetsDt = $('#assetsTable').DataTable({
      responsive: true,
      autoWidth: false,
      dom: "<'row'<'col-sm-12'tr>>" + "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
      language: {
        info: 'Showing _START_ to _END_ of _TOTAL_ entries',
        infoEmpty: 'Showing 0 to 0 of 0 entries',
        infoFiltered: '(filtered from _MAX_ total entries)',
      },
      buttons: [
        { extend: 'excelHtml5', text: '<i class="fas fa-file-excel mr-1"></i> Excel' },
        { extend: 'pdfHtml5', text: '<i class="fas fa-file-pdf mr-1"></i> PDF' },
        { extend: 'print', text: '<i class="fas fa-print mr-1"></i> Print' },
      ],
    });
    if ($('#assetsExportBtn').length) {
      $('#assetsExportBtn').on('click', function () {
        assetsDt.button(0).trigger();
      });
    }
    if ($('#assetsTableSearch').length) {
      $('#assetsTableSearch').on('keyup', function () {
        assetsDt.search(this.value).draw();
      });
    }
  }
  if ($('#departmentsTable').length) {
    $('#departmentsTable').DataTable({ responsive: true, autoWidth: false });
  }
  if ($('#categoriesTable').length) {
    $('#categoriesTable').DataTable({ responsive: true, autoWidth: false });
  }
  if ($('#transfersTable').length) {
    $('#transfersTable').DataTable(dtButtons).buttons().container().appendTo($('#bt').length ? '#bt' : '#transfersTable_wrapper');
  }
  if ($('#maintenanceTable').length) {
    $('#maintenanceTable').DataTable(dtButtons).buttons().container().appendTo($('#bt').length ? '#bt' : '#maintenanceTable_wrapper');
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
  const reportDtOptions = {
    responsive: true,
    autoWidth: false,
    dom: "B<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" + "<'row'<'col-sm-12'tr>>" + "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
    buttons: [
      { extend: 'print', text: '<i class="fas fa-print"></i> Print' },
      { extend: 'excelHtml5', text: '<i class="fas fa-file-excel"></i> Excel' },
      { extend: 'pdfHtml5', text: '<i class="fas fa-file-pdf"></i> PDF' },
    ],
  };
  if ($('#assetsListingTable').length) {
    $('#assetsListingTable').DataTable(reportDtOptions).buttons().container().appendTo($('#bt').length ? '#bt' : '#assetsListingTable_wrapper .col-md-6:eq(0)');
  }
  if ($('#transactionListingTable').length) {
    $('#transactionListingTable').DataTable(reportDtOptions).buttons().container().appendTo($('#bt').length ? '#bt' : '#transactionListingTable_wrapper .col-md-6:eq(0)');
  }
  if ($('#depreciationStatementTable').length) {
    $('#depreciationStatementTable').DataTable(reportDtOptions).buttons().container().appendTo($('#bt').length ? '#bt' : '#depreciationStatementTable_wrapper .col-md-6:eq(0)');
  }
  if ($('#historyTable').length) {
    $('#historyTable').DataTable({ responsive: true, autoWidth: false });
  }
  if ($('#depreciationTable').length) {
    $('#depreciationTable').DataTable({
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
