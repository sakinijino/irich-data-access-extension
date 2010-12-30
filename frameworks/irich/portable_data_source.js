// ==========================================================================
// sakinijino.com 
// ==========================================================================
//

sc_require("core")
sc_require("local_data_source")
sc_require("storages/portable")

iRich.PortableDataSource = iRich.LocalDataSource.extend({
  LOCAL_STORAGE_KEY: "irich.portable",
  _storage_adapter_class: iRich.PortableStorageAdapter,
  _support_type: SC.Record.PORTABLE
})
