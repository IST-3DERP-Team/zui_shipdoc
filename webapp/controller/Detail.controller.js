sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast",
    "../js/Common",
    "../js/TableValueHelp",
    "../js/TableFilter",
],

function (Controller, JSONModel, MessageBox, History, MessageToast, Common, TableValueHelp, TableFilter) {

    var me;
    var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "MM/dd/yyyy" });
    var dateFormat2 = sap.ui.core.format.DateFormat.getDateInstance({pattern : "yyyyMMdd" });
    var sapDateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "yyyy-MM-dd" });
    var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({ pattern: "KK:mm:ss a" });
    
    return Controller.extend("zuishipdoc.controller.Detail", {

        onInit: function() {
            me = this;
            this._oModel = this.getOwnerComponent().getModel();
            this._oModelCommon = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");               
            this._tableValueHelp = TableValueHelp;
            this._tableFilter = TableFilter;

            this._oTableLayout = {
                delvDtlTab: {
                    type: "SHPDOCDLVDTLS",
                    tabname: "Z3DERP_SHPDCDLVD"
                },
                delvStatTab: {
                    type: "SHPDOCDLVSTAT",
                    tabname: "ZERP_DLVSTAT"
                },
                delvSchedTab: {
                    type: "SHPDOCDLVSCHD",
                    tabname: "Z3DERP_SHPDCDLVS"
                }
            }

            var oView = this.getView();
            oView.addEventDelegate({
                onBeforeHide: function(oEvent) {
                    if (me._oLock.length > 0) { me.unLock(); }
                },
            }, oView);


            var oTableEventDelegate = {
                onkeyup: function (oEvent) {
                    me.onKeyUp(oEvent);
                },

                onAfterRendering: function (oEvent) {
                    var oControl = oEvent.srcControl;
                    var sTabId = oControl.sId.split("--")[oControl.sId.split("--").length - 1];

                    if (sTabId.substr(sTabId.length - 3) === "Tab") me._tableRendered = sTabId;
                    else me._tableRendered = "";

                    me.onAfterTableRendering();
                },

                onclick: function(oEvent) {
                    me.onTableClick(oEvent);
                }
            };

            this.byId("delvSchedTab").addEventDelegate(oTableEventDelegate);
            this.byId("delvDtlTab").addEventDelegate(oTableEventDelegate);
            this.byId("delvStatTab").addEventDelegate(oTableEventDelegate);

            var oFormInputEventDelegate = {
                onkeydown: function(oEvent){
                    me.onFormInputKeyDown(oEvent);
                },
            };

            this.byId("fldTOTALNOPKG").addEventDelegate(oFormInputEventDelegate);
            this.byId("fldREVNO").addEventDelegate(oFormInputEventDelegate);
            this.byId("fldGRSWT").addEventDelegate(oFormInputEventDelegate);
            this.byId("fldNETWT").addEventDelegate(oFormInputEventDelegate);
            this.byId("fldVOLUME").addEventDelegate(oFormInputEventDelegate);

            if (this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv === undefined) {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteMain", {}, true /*no history*/);
                return;
            }

            const route = this.getOwnerComponent().getRouter().getRoute("RouteDetail");
            route.attachPatternMatched(this.onPatternMatched, this);
        },

        onPatternMatched: async function() {
            me = this;
            this._oModel = this.getOwnerComponent().getModel();
            this._oModelCommon = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");            
            this._aColumns = [];
            this._aDataBeforeChange = [];
            this._oDataBeforeChange = {};
            this._sActiveTable = "delvHdrForm";
            this._validationErrors = [];
            this._aColFilters = [];
            this._aColSorters = [];
            this._colFilters = {};
            this._dataMode = this.getOwnerComponent().getModel("UI_MODEL").getData().action;
            this._oLock = [];
            this._bHeaderChanged = false;
            this._bDelvDtlChanged = false;

            if (this.getOwnerComponent().getModel("LOCK_MODEL").getData().item !== undefined) { this._oLock = this.getOwnerComponent().getModel("LOCK_MODEL").getData().item; }

            //set initial list of ship mode and status
            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("LOOKUP_MODEL").getData().shipmode), "shipmode");
            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("LOOKUP_MODEL").getData().status), "status");
            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("LOOKUP_MODEL").getData().issplant), "issplant");
            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("LOOKUP_MODEL").getData().shiptocust), "shiptocust");
            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("LOOKUP_MODEL").getData().soldtocust), "soldtocust");
            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("LOOKUP_MODEL").getData().salesterm), "salesterm");
            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("LOOKUP_MODEL").getData().wtuom), "wtuom");
            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("LOOKUP_MODEL").getData().voluom), "voluom");
            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("LOOKUP_MODEL").getData().dest), "dest");
            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("LOOKUP_MODEL").getData().consign), "consign");
            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("LOOKUP_MODEL").getData().acctyp), "acctyp");
            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("LOOKUP_MODEL").getData().custgrp), "custgrp");

            //update list of ship mode
            this._oModel.read("/ShipModeSHSet", {
                success: function (oData, oResponse) {
                    me.getView().getModel("shipmode").setProperty("/", oData.results);
                    // me.getView().setModel(new JSONModel(oData.results), "shipmode");
                },
                error: function (err) { }
            }); 

            //update list of status
            this._oModel.read("/StatusSHSet", {
                success: function (oData, oResponse) {
                    me.getView().getModel("status").setProperty("/", oData.results);
                    // me.getView().setModel(new JSONModel(oData.results), "status");
                },
                error: function (err) { }
            });  

            this._oModel.read("/IssPlantSHSet", {
                success: function (oData, oResponse) {
                    me.getView().getModel("issplant").setProperty("/", oData.results);
                    // me.getView().setModel(new JSONModel(oData.results), "issplant");
                },
                error: function (err) { }
            });

            this._oModel.read("/ShipToCustSHSet", {
                success: function (oData, oResponse) {
                    me.getView().getModel("shiptocust").setProperty("/", oData.results);
                    // me.getView().setModel(new JSONModel(oData.results), "shiptocust");

                    var oSoldToCust = [];

                    oData.results.forEach(item => {
                        if (item.CUSTGRP !== "") {
                            oSoldToCust.push(item);
                        }
                    })

                    me.getView().getModel("soldtocust").setProperty("/", oSoldToCust);
                },
                error: function (err) { }
            });

            this._oModel.read("/CustGrpSHSet", {
                success: function (oData, oResponse) {
                    me.getView().getModel("custgrp").setProperty("/", oData.results);
                },
                error: function (err) { }
            });

            this._oModel.read("/SalesTermSHSet", {
                success: function (oData, oResponse) {
                    me.getView().getModel("salesterm").setProperty("/", oData.results);
                    // me.getView().setModel(new JSONModel(oData.results), "salesterm");
                },
                error: function (err) { }
            });

            this._oModel.read("/WtUOMSHSet", {
                success: function (oData, oResponse) {
                    me.getView().getModel("wtuom").setProperty("/", oData.results);
                    // me.getView().setModel(new JSONModel(oData.results), "wtuom");
                },
                error: function (err) { }
            });

            this._oModel.read("/VolUOMSHSet", {
                success: function (oData, oResponse) {
                    me.getView().getModel("voluom").setProperty("/", oData.results);
                    // me.getView().setModel(new JSONModel(oData.results), "voluom");
                },
                error: function (err) { }
            });

            this._oModel.read("/DestSHSet", {
                success: function (oData, oResponse) {
                    me.getView().getModel("dest").setProperty("/", oData.results);
                    // me.getView().setModel(new JSONModel(oData.results), "dest");
                },
                error: function (err) { }
            });

            this._oModel.read("/AcctTypeSHSet", {
                success: function (oData, oResponse) {
                    me.getView().getModel("acctyp").setProperty("/", oData.results);
                    // me.getView().setModel(new JSONModel(oData.results), "dest");
                },
                error: function (err) { }
            });

            if (this.getOwnerComponent().getModel("COLUMNS_MODEL").getData().delvHdr !== undefined) {
                this._aColumns["delvHdr"] = this.getOwnerComponent().getModel("COLUMNS_MODEL").getData().delvHdr;
            }

            this.getDynamicColumns("SHPDOCHDR", "Z3DERP_SHPDCDLVH", "");

            setTimeout(() => {
                me.getDynamicColumns("SHPDOCDLVDTLS", "Z3DERP_SHPDCDLVD", "delvDtlTab");
            }, 100);

            setTimeout(() => {
                me.getDynamicColumns("SHPDOCDLVSTAT", "ZERP_DLVSTAT", "delvStatTab");
            }, 100);

            setTimeout(() => {
                me.getDynamicColumns("SHPDOCDLVSCHD", "Z3DERP_SHPDCDLVS", "delvSchedTab");
            }, 100);

            var oHeaderData = {};

            this.byId("delvSchedTab").setModel(new JSONModel({
                columns: [],
                rows: []
            })); 

            this.byId("delvDtlTab").setModel(new JSONModel({
                columns: [],
                rows: []
            })); 

            this.byId("delvStatTab").setModel(new JSONModel({
                columns: [],
                rows: []
            })); 

            this.getView().setModel(new JSONModel({
                fullscreen: {
                    header: false,
                    detail: false
                },
                dataWrap: {
                    delvSchedTab: false,
                    delvDtlTab: false,
                    delvStatTab: false
                }
            }), "ui");

            this.getView().setModel(new JSONModel({
                dlvsched: 0,
                dlvdtls: 0,
                dlvstat: 0
            }), "counts");            

            this.byId("itbDetail").setVisible(true);
            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("CAPTION_MSGS_MODEL").getData().text), "ddtext");
            this.byId("itbDetail").setSelectedKey("delvsched");           

            await this.getColumnProp(this);

            if (this._dataMode === "NEW" || this._dataMode === "EDIT") {
                this.setHeaderFieldsEditable(true);                

                if (this.getOwnerComponent().getModel("UI_MODEL").getData().action === "NEW") {
                    this.byId("itbDetail").setVisible(false);

                    oHeaderData = {
                        DLVNO: "",
                        ISSPLNT: "",
                        SOLDTOCUST: "",
                        BILLTOCUST: "",
                        CUSTGRP: "",
                        SALESTERM: "",
                        SALESTERMTEXT: "",
                        DOCDT: "",
                        POSTDT: "",
                        PLANDLVDT: "",
                        INDCDT: "",
                        EXFTYDT: "",
                        DEPARTDT: "",
                        EVERS: "",
                        DEST: "",
                        COO: "",
                        TOTALNOPKG: "",
                        REFDOCNO: "",
                        REFDOCDT: "",
                        REVNO: "",
                        STATUS: "50",
                        REMARKS: "",
                        VESSEL: "",
                        VOYAGE: "",
                        CARRIER: "",
                        FORWRDR: "",
                        FORREFNO: "",
                        BOOKINGNO: "",
                        PORTLD: "",
                        PORTDIS: "",
                        ETD: "",
                        ETA: "",
                        HBL: "",
                        HBLDT: "",
                        MBL: "",
                        MBLDT: "",
                        CONSIGN: "",
                        MESSRS: "",
                        INVPRE: "",
                        INVNO: "",
                        INVSUF: "",
                        INVDT: "",
                        ACCTTYP: "",
                        IMPTR: "",
                        EXPTR: "",
                        FINLDEST: "",
                        CONTTYP: "",
                        CONTNO: "",
                        SEALNO: "",
                        GRSWT: "",
                        NETWT: "",
                        WTUOM: "",
                        VOLUME: "",
                        VOLUOM: "",
                        NP1: "",
                        NP2: "",
                        NP3: "",
                        NP4: "",
                        EXPLICNO: "",
                        EXPLICDT: "",
                        INSPOL: "",
                        TCINVNO: ""
                    }
                }

                this.getView().byId("btnEditHdr").setVisible(false);
                this.getView().byId("btnRefreshHdr").setVisible(false);
                this.getView().byId("btnSaveHdr").setVisible(true);
                this.getView().byId("btnCancelHdr").setVisible(true);
                this.getView().byId("btnComplete").setVisible(false);

                this.getView().byId("btnEditShipDtl").setEnabled(false);
                this.getView().byId("btnRefreshShipDtl").setEnabled(false);

                var oIconTabBar = this.byId("itbDetail");
                oIconTabBar.getItems().forEach(item => item.setProperty("enabled", false));

                if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(true); }
            }
            else if (this._dataMode === "READ") {
                this.getView().byId("btnEditHdr").setEnabled(true);
                this.getView().byId("btnEditHdr").setVisible(true);
                this.getView().byId("btnRefreshHdr").setEnabled(true);
                this.getView().byId("btnRefreshHdr").setVisible(true);
                this.getView().byId("btnSaveHdr").setVisible(false);
                this.getView().byId("btnCancelHdr").setVisible(false);
    
                this.getView().byId("btnEditShipDtl").setEnabled(true);
                this.getView().byId("btnEditShipDtl").setVisible(true);
                this.getView().byId("btnRefreshShipDtl").setEnabled(true);
                this.getView().byId("btnRefreshShipDtl").setVisible(true);
                this.getView().byId("btnAddDelvSched").setEnabled(true);
                this.getView().byId("btnAddDelvSched").setVisible(true);
                this.getView().byId("btnDeleteDelvSched").setEnabled(true);
                this.getView().byId("btnDeleteDelvSched").setVisible(true);
                // this.getView().byId("btnCompleteDelvSched").setEnabled(true);
                this.getView().byId("btnRefreshDelvSched").setEnabled(true);
                this.getView().byId("btnRefreshDelvSched").setVisible(true);
                this.getView().byId("btnSaveShipDtl").setVisible(false);
                this.getView().byId("btnCancelShipDtl").setVisible(false);
                this.getView().byId("btnAddNewDelvSched").setVisible(false);
                this.getView().byId("btnRemoveNewDelvSched").setVisible(false);
                this.getView().byId("btnSavedDelvSched").setVisible(false);
                this.getView().byId("btnCancelDelvSched").setVisible(false);

                this.setHeaderFieldsEditable(false);
                this.setShipDetailFieldsEditable(false);

                var oIconTabBar = me.byId("itbDetail");
                oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));

                if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }
            }

            if (this._dataMode !== "NEW") {                
                oHeaderData = jQuery.extend(true, {}, this.getOwnerComponent().getModel("DELVDATA_MODEL").getData().header);
                var oDelvSchedData = jQuery.extend(true, [], this.getOwnerComponent().getModel("DELVDATA_MODEL").getData().detail);

                this.getDelvDetailData();
                this.getDelvStatusData(false); 

                this.byId("delvSchedTab").getModel().setProperty("/rows", oDelvSchedData);
                this.byId("delvSchedTab").bindRows("/rows");
                this.getView().getModel("counts").setProperty("/dlvsched", oDelvSchedData.length);
            }
            
            this.getView().setModel(new JSONModel(oHeaderData), "header");
            this._oDataBeforeChange = jQuery.extend(true, {}, oHeaderData);

            this._oModel.read("/ConsignSHSet", {
                urlParameters: {
                    "$filter": "CUSTGRP eq '" + oHeaderData.CUSTGRP + "'"
                },
                success: function (oData, oResponse) {
                    me.getView().getModel("consign").setProperty("/", oData.results);
                    // me.getView().setModel(new JSONModel(oData.results), "consign");
                },
                error: function (err) { }
            });

            // console.log(oHeaderData)
            // me.getColumnProp();
            // this.getView().byId("fldISSPLNT").setSelectedKey(oHeaderData.ISSPLNT);
            // this.getView().byId("fldSOLDTOCUST").setSelectedKey();
            // this.getView().byId("fldBILLTOCUST").setSelectedKey();
            // this.getView().byId("fldCUSTGRP").setSelectedKey();
            // this.getView().byId("fldSALESTERM").setSelectedKey();
            // this.getView().byId("fldEVERS").setSelectedKey();
            // this.getView().byId("fldDEST").setSelectedKey();
            // this.getView().byId("fldSTATUS").setSelectedKey();
            // this.getView().byId("fldCONSIGN").setSelectedKey();
            // this.getView().byId("fldMESSRS").setSelectedKey();
            // this.getView().byId("fldACCTTYP").setSelectedKey();
            // this.getView().byId("fldWTUOM").setSelectedKey();
            // this.getView().byId("fldVOLUOM").setSelectedKey();

            this.byId("headerForm").getFormContainers().forEach(item => {
                item.getFormElements().forEach(e => {
                    var sFieldName = "";

                    if (e.getFields()[0].isA("sap.m.Input")) {
                        if (e.getFields()[0].getProperty("showValueHelp")) {
                            sFieldName = e.getFields()[0].getProperty("name");
                            this.byId("fld" + sFieldName).setSelectedKey(oHeaderData[sFieldName]);
                            // console.log(e.getFields()[0]);
                        }
                    }
                })
            })
        },

        onNavBack: function(oEvent) {
            this.getOwnerComponent().getModel("LOCK_MODEL").setProperty("/item", this._oLock);          
        },

        onExit: function(oEvent) {
            if (me._oLock.length > 0) { me.unLock(); }
        },

        // getColumnProp: async function() {
        //     var sPath = jQuery.sap.getModulePath("zuishipdoc", "/model/columns.json");

        //     var oModelColumns = new JSONModel();
        //     await oModelColumns.loadData(sPath);

        //     this._oModelColumns = oModelColumns.getData();
        //     TableValueHelp.setFormSuggestion(this, "header");
        // },

        getColumnProp: async (me) => {
            var sPath = jQuery.sap.getModulePath("zuishipdoc", "/model/columns.json");
            var oModelColumns = new JSONModel();
            await oModelColumns.loadData(sPath);

            me._oModelColumns = oModelColumns.getData();
            TableValueHelp.setFormSuggestion(me, "header");
        },

        getDynamicColumns(arg1, arg2, arg3) {
            var sType = arg1;
            var sTabName = arg2;
            var sTabId = arg3;
            var vSBU = this.getOwnerComponent().getModel("UI_MODEL").getData().sbu; 

            this._oModelCommon.setHeaders({
                sbu: vSBU,
                type: sType,
                tabname: sTabName
            });

            this._oModelCommon.read("/ColumnsSet", {
                success: function (oData) {
                    if (sTabId === "") {
                        me._aColumns["delvHdr"] = oData.results;
                        me.formatFormInput(oData.results);
                    }
                    else {
                        if (sType === "SHPDOCDLVSTAT") { 
                            oData.results.forEach(item => {
                                if (item.ColumnName === "COMPLETE") {
                                    item.DataType = "BOOLEAN";
                                }
                            })
                        }

                        if (oData.results.length > 0) {
                            me._aColumns[sTabId.replace("Tab", "")] = oData.results;
                            me.setTableColumns(sTabId, oData.results);  
                        }
                        else {
                            var oTable = me.byId(sTabId);
                            if (oTable.getColumns().length > 0) {
                                oTable.getModel().setProperty("/columns", []);
                            }
                        }
                    }
                },
                error: function (err) { }
            });
        },

        setTableColumns(arg1, arg2) {
            var sTabId = arg1;
            var oColumns = arg2;
            var oTable = this.byId(sTabId);

            oTable.getModel().setProperty("/columns", oColumns);

            //bind the dynamic column to the table
            oTable.bindColumns("/columns", function (index, context) {
                var sColumnId = context.getObject().ColumnName;
                var sColumnLabel = context.getObject().ColumnLabel;
                var sColumnWidth = context.getObject().ColumnWidth;
                var sColumnVisible = context.getObject().Visible;
                var sColumnSorted = context.getObject().Sorted;
                var sColumnSortOrder = context.getObject().SortOrder;
                var sColumnDataType = context.getObject().DataType;
                var sTextWrapping = context.getObject().WrapText;

                if (sColumnWidth === 0) sColumnWidth = 100;

                var oText = new sap.m.Text({
                    wrapping: sTextWrapping === "X" ? true : false,
                    tooltip: sColumnDataType === "BOOLEAN" ? "" : "{" + sColumnId + "}"
                })

                if (sColumnId === "DLVSTATCD") {
                    oText.bindText({  
                        parts: [  
                            { path: sColumnId }
                        ],  
                        formatter: function(sColumnId) {
                            var oValue = me.getView().getModel("status").getData().filter(v => v.DLVSTATCD === sColumnId);

                            if (oValue && oValue.length > 0) {
                                return oValue[0].SHORTTEXT + " (" + sColumnId + ")";
                            }
                            else return sColumnId;
                        }
                    });
                }
                else if (sColumnId === "CUSTSHIPTO" || sColumnId === "SOLDTOCUST") {
                    oText.bindText({  
                        parts: [  
                            { path: sColumnId }
                        ],  
                        formatter: function(sColumnId) {
                            var oValue = me.getView().getModel("shiptocust").getData().filter(v => v.CUSTOMER === sColumnId);

                            if (oValue && oValue.length > 0) {
                                return oValue[0].NAME1 + " (" + sColumnId + ")";
                            }
                            else return sColumnId;
                        }
                    });
                }
                else {
                    oText.bindText({  
                        parts: [  
                            { path: sColumnId }
                        ]
                    }); 
                }

                if (sColumnDataType === "BOOLEAN") {
                    return new sap.ui.table.Column({
                        id: sTabId.replace("Tab", "") + "Col" + sColumnId,
                        name: sColumnId,
                        label: new sap.m.Text({text: sColumnLabel}),
                        template: new sap.m.CheckBox({
                            selected: "{" + sColumnId + "}",
                            editable: false
                        }),
                        width: sColumnWidth + 'px',
                        sortProperty: sColumnId,
                        // filterProperty: sColumnId,
                        autoResizable: true,
                        visible: sColumnVisible,
                        sorted: sColumnSorted,                        
                        hAlign: sColumnDataType === "NUMBER" ? "End" : sColumnDataType === "BOOLEAN" ? "Center" : "Begin",
                        sortOrder: ((sColumnSorted === true) ? sColumnSortOrder : "Ascending" ),
                    });
                }
                else {
                    return new sap.ui.table.Column({
                        id: sTabId.replace("Tab", "") + "Col" + sColumnId,
                        name: sColumnId,
                        label: new sap.m.Text({text: sColumnLabel}),
                        template: oText,
                        // template: new sap.m.Text({ 
                        //     text: "{" + sColumnId + "}", 
                        //     wrapping: false,
                        //     tooltip: sColumnDataType === "BOOLEAN" ? "" : "{" + sColumnId + "}"
                        // }),
                        width: sColumnWidth + 'px',
                        sortProperty: sColumnId,
                        // filterProperty: sColumnId,
                        autoResizable: true,
                        visible: sColumnVisible,
                        sorted: sColumnSorted,                        
                        hAlign: sColumnDataType === "NUMBER" ? "End" : sColumnDataType === "BOOLEAN" ? "Center" : "Begin",
                        sortOrder: ((sColumnSorted === true) ? sColumnSortOrder : "Ascending" ),
                    });
                }
            });

            var vWrap = oColumns[0].WrapText === "X" ? true : false;
            this.getView().getModel("ui").setProperty("/dataWrap/" + sTabId, vWrap);

            //date/number sorting
            oTable.attachSort(function(oEvent) {
                var sPath = oEvent.getParameter("column").getSortProperty();
                var bDescending = false;
                
                oTable.getColumns().forEach(col => {
                    if (col.getSorted()) {
                        col.setSorted(false);
                    }
                })
                
                oEvent.getParameter("column").setSorted(true); //sort icon initiator

                if (oEvent.getParameter("sortOrder") === "Descending") {
                    bDescending = true;
                    oEvent.getParameter("column").setSortOrder("Descending") //sort icon Descending
                }
                else {
                    oEvent.getParameter("column").setSortOrder("Ascending") //sort icon Ascending
                }

                var oSorter = new sap.ui.model.Sorter(sPath, bDescending ); //sorter(columnData, If Ascending(false) or Descending(True))
                var oColumn = oColumns.filter(fItem => fItem.ColumnName === oEvent.getParameter("column").getProperty("sortProperty"));
                var columnType = oColumn[0].DataType;

                if (columnType === "DATETIME") {
                    onSorter.fnCompare = function(a, b) {
                        // parse to Date object
                        var aDate = new Date(a);
                        var bDate = new Date(b);

                        if (bDate === null) { return -1; }
                        if (aDate === null) { return 1; }
                        if (aDate < bDate) { return -1; }
                        if (aDate > bDate) { return 1; }

                        return 0;
                    };
                }
                else if (columnType === "NUMBER") {
                    oSorter.fnCompare = function(a, b) {
                        // parse to Date object
                        var aNumber = +a;
                        var bNumber = +b;

                        if (bNumber === null) { return -1; }
                        if (aNumber === null) { return 1; }
                        if (aNumber < bNumber) { return -1; }
                        if (aNumber > bNumber) { return 1; }

                        return 0;
                    };
                }
                
                oTable.getBinding('rows').sort(oSorter);
                // prevent internal sorting by table
                oEvent.preventDefault();
            });

            TableFilter.updateColumnMenu(sTabId, this);
        },

        getHeaderData(busy) {
            if (busy) { Common.openProcessingDialog(this); }

            this._oModel.read('/HeaderSet', {
                urlParameters: {
                    "$filter": "DLVNO eq '" + this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv + "'"
                },
                success: function (oData) {
                    oData.results.forEach((item, index) => {  
                        if (!(item.DOCDT === null || item.DOCDT === ""))
                        { item.DOCDT = dateFormat.format(new Date(item.DOCDT)); }

                        if (!(item.POSTDT === null || item.POSTDT === ""))
                        { item.POSTDT = dateFormat.format(new Date(item.POSTDT)); }

                        if (!(item.PLANDLVDT === null || item.PLANDLVDT === ""))
                        { item.PLANDLVDT = dateFormat.format(new Date(item.PLANDLVDT)); }

                        if (!(item.INDCDT === null || item.INDCDT === ""))
                        { item.INDCDT = dateFormat.format(new Date(item.INDCDT)); }

                        if (!(item.EXFTYDT === null || item.EXFTYDT === ""))
                        { item.EXFTYDT = dateFormat.format(new Date(item.EXFTYDT)); }

                        if (!(item.DEPARTDT === null || item.DEPARTDT === ""))
                        { item.DEPARTDT = dateFormat.format(new Date(item.DEPARTDT)); }

                        if (!(item.REFDOCDT === null || item.REFDOCDT === ""))
                        { item.REFDOCDT = dateFormat.format(new Date(item.REFDOCDT)); }

                        if (!(item.CREATEDDT === null || item.CREATEDDT === ""))
                        {item.CREATEDDT = dateFormat.format(new Date(item.CREATEDDT)) + " " + me.formatTimeOffSet(item.CREATEDTM.ms); }

                        if (!(item.UPDATEDDT === null || item.UPDATEDDT === ""))
                        { item.UPDATEDDT = dateFormat.format(new Date(item.UPDATEDDT)) + " " + me.formatTimeOffSet(item.UPDATEDTM.ms); }

                        if (!(item.ETD === null || item.ETD === ""))
                        { item.ETD = dateFormat.format(new Date(item.ETD)); }

                        if (!(item.ETA === null || item.ETA === ""))
                        { item.ETA = dateFormat.format(new Date(item.ETA)); }

                        if (!(item.HBLDT === null || item.HBLDT === ""))
                        { item.HBLDT = dateFormat.format(new Date(item.HBLDT)); }

                        if (!(item.MBLDT === null || item.MBLDT === ""))
                        { item.MBLDT = dateFormat.format(new Date(item.MBLDT)); }

                        if (!(item.INVDT === null || item.INVDT === ""))
                        { item.INVDT = dateFormat.format(new Date(item.INVDT)); }

                        if (!(item.EXPLICDT === null || item.EXPLICDT === ""))
                        { item.EXPLICDT = dateFormat.format(new Date(item.EXPLICDT)); }

                        if (!(item.DELETED === null || item.DELETED === ""))
                        { item.DELETED = true; }
                        else { item.DELETED = false; }

                        if (!(item.MULTISOLDTO === null || item.MULTISOLDTO === ""))
                        { item.MULTISOLDTO = true; }
                        else { item.MULTISOLDTO = false; }
                        
                        if (index === 0) {
                            item.ACTIVE = "X";
                            me.getOwnerComponent().getModel("UI_MODEL").setProperty("/activeDlv", item.DLVNO);
                        }
                        else { item.ACTIVE = ""; }
                    });

                    me.getView().getModel("header").setProperty("/", oData.results[0]);
                    me._oDataBeforeChange = jQuery.extend(true, {}, oData.results[0]);
 
                    if (busy) { Common.closeProcessingDialog(me); }
                },
                error: function (err) { 
                    Common.closeProcessingDialog(me);
                }
            })
        },

        getDelvSchedData() {
            Common.openProcessingDialog(me, "Processing...");

            this._oModel.read('/DelvSchedSet', {
                urlParameters: {
                    "$filter": "DLVNO eq '" + this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv + "'"
                },
                success: function (oData) {
                    if (oData.results.length > 0) {
                        oData.results.forEach((item, index) => {  
                            // if (item.CREATEDDT !== null)
                            //     item.CREATEDDT = dateFormat.format(new Date(item.CREATEDDT)) + " " + me.formatTimeOffSet(item.CREATEDTM.ms);

                            // if (item.UPDATEDDT !== null)
                            //     item.UPDATEDDT = dateFormat.format(new Date(item.UPDATEDDT)) + " " + me.formatTimeOffSet(item.UPDATEDTM.ms);

                            if (item.CPODT !== "") item.CPODT = dateFormat.format(item.CPODT);
                            if (item.DLVDT !== "") item.DLVDT = dateFormat.format(item.DLVDT);
                            if (item.REVDLVDT !== "") item.REVDLVDT = dateFormat.format(item.REVDLVDT);
                            
                            item.CPOITEM = item.CPOITEM + "";
                            item.CPOREV = item.CPOREV + "";
                            item.DLVSEQ = item.DLVSEQ + "";
                            item.ROWINDEX = index;

                            if (index === 0) item.ACTIVE = "X";
                            else item.ACTIVE = "";
                        });
                    }

                    me.byId("delvSchedTab").getModel().setProperty("/rows", oData.results);
                    me.byId("delvSchedTab").bindRows("/rows");                    
                    me.getView().getModel("counts").setProperty("/dlvsched", oData.results.length);
                    me.setActiveRowHighlightByTableId("delvSchedTab");

                    // if (me._aColFilters.length > 0) { me.setColumnFilters("delvSchedTab"); }
                    if (me._aColSorters.length > 0) { me.setColumnSorters("delvSchedTab"); }
                    TableFilter.applyColFilters("delvSchedTab", me);

                    Common.closeProcessingDialog(me);
                },
                error: function (err) {
                    Common.closeProcessingDialog(me);
                }
            })
        },

        getDelvDetailData() {
            Common.openProcessingDialog(this);

            this._oModel.read('/DelvDetailSet', {
                urlParameters: {
                    "$filter": "DLVNO eq '" + this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv + "'"
                },
                success: function (oData) {
                    // console.log(oData)
                    if (oData.results.length > 0) {
                        oData.results.sort((a,b) => (a.DLVITEM > b.DLVITEM ? 1 : -1));

                        oData.results.forEach((item, index) => {  
                            if (index === 0) { item.ACTIVE = "X"; }
                            else { item.ACTIVE = ""; }

                            item.EDITED = false;
                        });
                    }

                    me.byId("delvDtlTab").getModel().setProperty("/rows", oData.results);
                    me.byId("delvDtlTab").bindRows("/rows");
                    me.getView().getModel("counts").setProperty("/dlvdtls", oData.results.length);
                    me.setActiveRowHighlightByTableId("delvDtlTab");

                    // if (me._aColFilters.length > 0) { me.setColumnFilters("delvDtlTab"); }
                    if (me._aColSorters.length > 0) { me.setColumnSorters("delvDtlTab"); }
                    TableFilter.applyColFilters("delvDtlTab", me);

                    Common.closeProcessingDialog(me);
                },
                error: function (err) { 
                    Common.closeProcessingDialog(me);
                }
            })
        },

        getDelvStatusData(busy) {
            if (busy) { Common.openProcessingDialog(this); }

            this._oModel.read('/StatusSet', {
                urlParameters: {
                    "$filter": "DLVNO eq '" + this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv + "'"
                },
                success: function (oData) {
                    if (oData.results.length > 0) {
                        // oData.results.sort((a,b) => (a.DLVITEM > b.DLVITEM ? 1 : -1));

                        oData.results.forEach((item, index) => {  
                            if (!(item.UPDATEDDT === null || item.UPDATEDDT === ""))
                            { item.UPDATEDDT = dateFormat.format(new Date(item.UPDATEDDT)) + " " + me.formatTimeOffSet(item.UPDATEDTM.ms); }
                            console.log()
                            item.COMPLETE = item.COMPLETE === "X" ? true : false;

                            if (index === 0) { item.ACTIVE = "X"; }
                            else { item.ACTIVE = ""; }
                        });
                    }

                    me.byId("delvStatTab").getModel().setProperty("/rows", oData.results);
                    me.byId("delvStatTab").bindRows("/rows");
                    me.getView().getModel("counts").setProperty("/dlvstat", oData.results.length);
                    me.setActiveRowHighlightByTableId("delvStatTab");

                    // if (me._aColFilters.length > 0) { me.setColumnFilters("delvStatTab"); }
                    if (me._aColSorters.length > 0) { me.setColumnSorters("delvStatTab"); }
                    TableFilter.applyColFilters("delvStatTab", me);

                    if (busy) { Common.closeProcessingDialog(me); }
                },
                error: function (err) { 
                    Common.closeProcessingDialog(me);
                }
            })
        },
        
        onCreate: function (oEvent) {
            this._sActiveTable = oEvent.getSource().data("TableId");
            this.createData();
        },

        async createData() { 
            if (this._dataMode === "READ") {
                var vStatus = "", vSoldToCust = "", vIssPlant = "";

                if (this.getView().byId("fldSTATUS").getSelectedKey() !== "") { vStatus = this.getView().byId("fldSTATUS").getSelectedKey(); }
                else { vStatus = this.getView().getModel("header").getData().STATUS; }

                if (vStatus !== "50") {
                    MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_SHIPDOC_CHANGE_NOT_ALLOW"]);
                    return;
                }

                var oTable = this.byId(this._sActiveTable);

                var bProceed = await this.lock(this);
                if (!bProceed) return;
    
                this._aDataBeforeChange = jQuery.extend(true, [], oTable.getModel().getData().rows);
                this._addToDelvSched = [];
    
                if (this._sActiveTable === "delvSchedTab") {
                    //get fragment data
                    Common.openProcessingDialog(me, "Processing...");

                    if (this.getView().byId("fldSOLDTOCUST").getSelectedKey() !== "") { vSoldToCust = this.getView().byId("fldSOLDTOCUST").getSelectedKey(); }
                    else { vSoldToCust = this.getView().getModel("header").getData().SOLDTOCUST; }
                    if (this.getView().byId("fldISSPLNT").getSelectedKey() !== "") { vIssPlant = this.getView().byId("fldISSPLNT").getSelectedKey(); }
                    else { vIssPlant = this.getView().getModel("header").getData().ISSPLNT; }
    
                    var vMultiSoldTo = this.getView().byId("fldMULTISOLDTO").getSelected();
                    var vSoldToCust = vMultiSoldTo ? "MULTIXYZ" : vSoldToCust;

                    this._oModel.setHeaders({
                        plant: vIssPlant,
                        custcd: vSoldToCust
                    })
                    console.log(this._oModel)
                    this._oModel.read('/IODelvSet', {
                        success: function (oData) {                           
                            Common.closeProcessingDialog(me);
                            console.log(oData.results)
                            oData.results.forEach((item, index) => {
                                if (item.CPODT !== "") item.CPODT = dateFormat.format(item.CPODT);
                                if (item.DLVDT !== "") item.DLVDT = dateFormat.format(item.DLVDT);
                                if (item.REVDLVDT !== "") item.REVDLVDT = dateFormat.format(item.REVDLVDT);
                                item.CPOITEM = item.CPOITEM + "";
                                item.CPOREV = item.CPOREV + "";
                                item.DLVSEQ = item.DLVSEQ + "";
                                item.ROWINDEX = index;
                                item.DLVNO = me.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv;
                            })
    
                            if (!me._AddDelvSchedDialog) {
                                me._AddDelvSchedDialog = sap.ui.xmlfragment("zuishipdoc.view.fragments.dialog.AddDelvSchedDialog", me);
            
                                me._AddDelvSchedDialog.setModel(
                                    new JSONModel({
                                        rows: oData.results,
                                        rowCount: oData.results.length > 13 ? oData.results.length : 13,
                                        recCount: oData.results.length
                                    })
                                )
            
                                me.getView().addDependent(me._AddDelvSchedDialog);
                            }
                            else {
                                me._AddDelvSchedDialog.getModel().setProperty("/rows", oData.results);
                                me._AddDelvSchedDialog.getModel().setProperty("/rowCount", oData.results.length > 13 ? oData.results.length : 13);
                                me._AddDelvSchedDialog.getModel().setProperty("/recCount", oData.results.length);
                            }
            
                            me._AddDelvSchedDialog.getContent()[0].removeSelectionInterval(0, oData.results.length - 1);
    
                            //open fragment
                            me._AddDelvSchedDialog.open();
                            me._dataMode = "NEW";
                            if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(true); }
                        },
                        error: function (err) {
                            Common.closeProcessingDialog(me);
                            me.unLock();
                        }
                    })
    
                    if (this.byId("delvSchedTab").getBinding("rows").aSorters.length > 0) {
                        this._aColSorters = this.byId("delvSchedTab").getBinding("rows").aSorters;
                    }
                }
            }
        },

        onAddNewRow: function (oEvent) {
            var oTable = oEvent.getSource().oParent.oParent;

            if (oTable.getId().indexOf("delvSchedTab") >= 0) {
                //get fragment data
                me._AddDelvSchedDialog.getContent()[0].removeSelectionInterval(0, this._AddDelvSchedDialog.getModel().getData().rows.length - 1);

                //open fragment
                me._AddDelvSchedDialog.open();
            }
        },

        onEdit: function(oEvent) {
            this._sActiveTable = oEvent.getSource().data("TableId");
            this.editData();
        },

        async editData() {
            if (this._dataMode === "READ") {
                var oTable = this.byId(this._sActiveTable);
                var vStatus = "";

                if (this._sActiveTable === "delvDtlTab" && oTable.getModel().getData().rows.length === 0) {
                    MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_NO_DATA_EDIT"]);
                    return;
                }

                if (this.getView().byId("fldSTATUS").getSelectedKey() !== "") { vStatus = this.getView().byId("fldSTATUS").getSelectedKey(); }
                else { vStatus = this.getView().getModel("header").getData().STATUS; }

                if (vStatus !== "50") {
                    MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_SHIPDOC_CHANGE_NOT_ALLOW"]);
                    return;
                }

                var bProceed = await this.lock(this);
                if (!bProceed) return;
                
                if (this._sActiveTable === "delvHdrForm") {
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("header").getData());
                    this.setHeaderFieldsEditable(true);
                    this._bHeaderChanged = false;
    
                    this.getView().byId("btnEditHdr").setVisible(false);
                    this.getView().byId("btnRefreshHdr").setVisible(false);
                    this.getView().byId("btnSaveHdr").setVisible(true);
                    this.getView().byId("btnCancelHdr").setVisible(true);
                    this.getView().byId("btnComplete").setVisible(false);              
    
                    var oIconTabBar = this.byId("itbDetail");
                    oIconTabBar.getItems().forEach(item => item.setProperty("enabled", false));  
                }
                else if (this._sActiveTable === "shipDtlForm") {
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("header").getData());
                    this.setShipDetailFieldsEditable(true);
                    this._bHeaderChanged = false;
    
                    this.getView().byId("btnEditShipDtl").setVisible(false);
                    this.getView().byId("btnRefreshShipDtl").setVisible(false);
                    this.getView().byId("btnSaveShipDtl").setVisible(true);
                    this.getView().byId("btnCancelShipDtl").setVisible(true);                
    
                    this.getView().byId("btnEditHdr").setEnabled(false);
                    this.getView().byId("btnRefreshHdr").setEnabled(false);
                    this.getView().byId("btnComplete").setEnabled(false);
    
                    var oIconTabBar = this.byId("itbDetail");
                    oIconTabBar.getItems().filter(item => item.getProperty("key") !== oIconTabBar.getSelectedKey())
                        .forEach(item => item.setProperty("enabled", false));                
                }
                else if (this._sActiveTable === "delvDtlTab") {
                    if (oTable.getModel().getData().rows.length === 0) {
                        me.unLock();
                        MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_NO_DATA_EDIT"]);
                        return;
                    }
    
                    this._aDataBeforeChange = jQuery.extend(true, [], oTable.getModel().getData().rows);
                    this._bDelvDtlChanged = false;
    
                    this.getView().byId("btnEditDelvDtl").setVisible(false);
                    this.getView().byId("btnRefreshDelvDtl").setVisible(false);
                    this.getView().byId("btnSaveDelvDtl").setVisible(true);
                    this.getView().byId("btnCancelDelvDtl").setVisible(true);
                    this.getView().byId("btnTabLayoutDelvDtl").setVisible(false);
                    this.getView().byId("btnDataWrapDelvDtl").setVisible(false);

                    this.getView().byId("btnEditHdr").setEnabled(false);
                    this.getView().byId("btnRefreshHdr").setEnabled(false);
                    this.getView().byId("btnComplete").setEnabled(false);
    
                    var oIconTabBar = this.byId("itbDetail");
                    oIconTabBar.getItems().filter(item => item.getProperty("key") !== oIconTabBar.getSelectedKey())
                        .forEach(item => item.setProperty("enabled", false));  
    
                    if (this.byId("delvDtlTab").getBinding("rows").aFilters.length > 0) {
                        this._aColFilters = this.byId("delvDtlTab").getBinding("rows").aFilters;
                    }
    
                    if (this.byId("delvDtlTab").getBinding("rows").aSorters.length > 0) {
                        this._aColSorters = this.byId("delvDtlTab").getBinding("rows").aSorters;
                    }
    
                    this.setRowEditMode();
                }
    
                this._validationErrors = [];
                this._dataMode = "EDIT";
            }
        },

        onCancel: function(oEvent) {
            this._sActiveTable = oEvent.getSource().data("TableId");
            this.cancelData();  
        },

        cancelData() {
            if (this._dataMode === "EDIT" || this._dataMode === "NEW") {
                var oTable = this.byId(this._sActiveTable);
                var oData = {};
                var bChanged = true;

                if (this._sActiveTable === "delvHdrForm") {
                    if (this._dataMode === "NEW") { bChanged = true; }
                    else { bChanged = this._bHeaderChanged; }

                    oData = {
                        Process: "header-cancel",
                        Text: this.getView().getModel("ddtext").getData()["CONF_DISCARD_CHANGE"]
                    }
                }
                else if (this._sActiveTable === "shipDtlForm") {
                    bChanged = this._bHeaderChanged;
                    
                    oData = {
                        Process: "shipdtl-cancel",
                        Text: this.getView().getModel("ddtext").getData()["CONF_DISCARD_CHANGE"]
                    }
                }
                else if (this._sActiveTable === "delvSchedTab") {
                    if (oTable.getModel().getData().rows.length === 0) { bChanged = false }

                    oData = {
                        Process: "delvsched-cancel",
                        Text: this.getView().getModel("ddtext").getData()["CONF_DISCARD_CHANGE"]
                    }
                }
                else if (this._sActiveTable === "delvDtlTab") {
                    bChanged = this._bDelvDtlChanged;

                    oData = {
                        Process: "delvdtl-cancel",
                        Text: this.getView().getModel("ddtext").getData()["CONF_DISCARD_CHANGE"]
                    }
                }

                if (!this._ConfirmDialog) {
                    this._ConfirmDialog = sap.ui.xmlfragment("zuishipdoc.view.fragments.dialog.ConfirmDialog", this);

                    this._ConfirmDialog.setModel(new JSONModel(oData));
                    this.getView().addDependent(this._ConfirmDialog);
                }
                else this._ConfirmDialog.setModel(new JSONModel(oData));
                    
                if (bChanged) {
                    this._ConfirmDialog.open();
                }
                else {
                    if (this._sActiveTable === "delvHdrForm") {
                        this.setHeaderFieldsEditable(false);

                        this.getView().byId("btnEditHdr").setVisible(true);
                        this.getView().byId("btnRefreshHdr").setVisible(true);
                        this.getView().byId("btnSaveHdr").setVisible(false);
                        this.getView().byId("btnCancelHdr").setVisible(false);
                        this.getView().byId("btnComplete").setVisible(true);
        
                        this.getView().byId("btnEditShipDtl").setEnabled(true);
                        this.getView().byId("btnRefreshShipDtl").setEnabled(true);
                        this.getView().byId("btnAddDelvSched").setEnabled(true);
                        this.getView().byId("btnDeleteDelvSched").setEnabled(true);
                        this.getView().byId("btnRefreshDelvSched").setEnabled(true);
        
                        var oHeaderData = this._oDataBeforeChange;
                        this.getView().setModel(new JSONModel(oHeaderData), "header");
                    }
                    else if (this._sActiveTable === "shipDtlForm") {
                        this.setShipDetailFieldsEditable(false);

                        this.getView().byId("btnEditShipDtl").setVisible(true);
                        this.getView().byId("btnRefreshShipDtl").setVisible(true);
                        this.getView().byId("btnSaveShipDtl").setVisible(false);
                        this.getView().byId("btnCancelShipDtl").setVisible(false);
        
                        this.getView().byId("btnEditHdr").setEnabled(true);
                        this.getView().byId("btnRefreshHdr").setEnabled(true);
                        this.getView().byId("btnComplete").setEnabled(true);
        
                        var oHeaderData = this._oDataBeforeChange;
                        this.getView().setModel(new JSONModel(oHeaderData), "header");                    
                    }
                    else if (this._sActiveTable === "delvSchedTab") {
                        var oTable = this.byId("delvSchedTab");

                        this.getView().byId("btnAddDelvSched").setVisible(true);
                        this.getView().byId("btnDeleteDelvSched").setVisible(true);
                        this.getView().byId("btnRefreshDelvSched").setVisible(true);
                        this.getView().byId("btnAddNewDelvSched").setVisible(false);
                        this.getView().byId("btnRemoveNewDelvSched").setVisible(false);
                        this.getView().byId("btnSavedDelvSched").setVisible(false);
                        this.getView().byId("btnCancelDelvSched").setVisible(false);
        
                        this.getView().byId("btnEditHdr").setEnabled(true);
                        this.getView().byId("btnRefreshHdr").setEnabled(true);
                        this.getView().byId("btnComplete").setEnabled(true);
                        
                        oTable.getModel().setProperty("/rows", this._aDataBeforeChange);
                        oTable.bindRows("/rows");
        
                        if (this._aColSorters.length > 0) { this.setColumnSorters("delvSchedTab"); }  
                        TableFilter.applyColFilters("delvSchedTab", me);                    
                    }
                    else if (this._sActiveTable === "delvDtlTab") {
                        var oTable = this.byId("delvDtlTab");

                        this.getView().byId("btnEditDelvDtl").setVisible(true);
                        this.getView().byId("btnRefreshDelvDtl").setVisible(true);
                        this.getView().byId("btnSaveDelvDtl").setVisible(false);
                        this.getView().byId("btnCancelDelvDtl").setVisible(false);
                        this.getView().byId("btnTabLayoutDelvDtl").setVisible(true);
                        this.getView().byId("btnDataWrapDelvDtl").setVisible(true);
        
                        this.getView().byId("btnEditHdr").setEnabled(true);
                        this.getView().byId("btnRefreshHdr").setEnabled(true);
                        this.getView().byId("btnComplete").setEnabled(true);
        
                        this.setRowReadMode();
                        
                        oTable.getModel().setProperty("/rows", this._aDataBeforeChange);
                        oTable.bindRows("/rows");
        
                        if (this._aColSorters.length > 0) { this.setColumnSorters("delvDtlTab"); }
                        TableFilter.applyColFilters("delvDtlTab", me);                    
                    }

                    var oIconTabBar = me.byId("itbDetail");
                    oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));

                    this._ConfirmDialog.close();

                    if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }

                    if (this._ConfirmDialog.getModel().getData().Process === "header-cancel" && this._dataMode === "NEW") {
                        var oHistory, sPreviousHash;
                    
                        if (sap.ui.core.routing.History !== undefined) {
                            oHistory = sap.ui.core.routing.History.getInstance();
                            sPreviousHash = oHistory.getPreviousHash();
                        }
            
                        if (sPreviousHash !== undefined) {
                            window.history.go(-1);
                        } else { 
                            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                            oRouter.navTo("RouteMain", {}, true /*no history*/);
                        }
                    }
                    else { this.unLock(); }

                    this._dataMode = "READ";
                }
            }
        },     

        onSave: function(oEvent) {  
            this._sActiveTable = oEvent.getSource().data("TableId");
            this.batchSaveData();  
        },

        batchSaveData() {
            if (this._dataMode === "EDIT" || this._dataMode === "NEW") {
                var oTable = this.byId(this._sActiveTable);
                var oParam = {};
                var bProceed = true;
                var aReqFields = [];

                if (this._sActiveTable === "delvHdrForm") {
                    if (!this._bHeaderChanged) {
                        MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_NO_DATA_MODIFIED"]);
                        return;
                    }

                    if (this._validationErrors.length > 0) {
                        MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_CHECK_INVALID_ENTRIES"]);
                        return;
                    }

                    this.byId("headerForm").getFormContainers().forEach(item => {
                        item.getFormElements().forEach(e => {
                            var sFieldName = "";
        
                            if (e.getFields()[0].getBindingInfo("value") !== undefined) {
                                sFieldName = e.getFields()[0].getBindingInfo("value").parts[0].path.replace("/","");
                            }
                            else if (e.getFields()[0].getBindingInfo("selected") !== undefined) {
                                sFieldName = "";
                            }
        
                            if (sFieldName !== "") {
                                var oColumn = this._aColumns["delvHdr"].filter(fItem => fItem.ColumnName === sFieldName);

                                if (oColumn[0].Mandatory) {
                                    if (oColumn[0].DataType === "DATETIME") {
                                        if (e.getFields()[0].getProperty("value") === "") {
                                            aReqFields.push(e.getLabel().getProperty("text"));
                                            bProceed = false;
                                        }
                                    }
                                    else {
                                        if (oColumn[0].Mandatory && !(e.getFields()[0].getProperty("value") !== "" || (e.getFields()[0].getProperty("selectedKey") !== undefined && e.getFields()[0].getProperty("selectedKey") !== ""))) {
                                            aReqFields.push(e.getLabel().getProperty("text"));
                                            bProceed = false;
                                        }
                                    }
                                }
                            }
                        })
                    })
                    
                    if (!bProceed) {
                        MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_INPUT_REQD_FIELDS"]);
                        return;
                    }

                    Common.openProcessingDialog(this);

                    oParam["ISSPLNT"] = this.getView().byId("fldISSPLNT").getSelectedKey();
                    oParam["SOLDTOCUST"] = this.getView().byId("fldSOLDTOCUST").getSelectedKey();
                    oParam["BILLTOCUST"] = this.getView().byId("fldBILLTOCUST").getSelectedKey();
                    oParam["CUSTGRP"] = this.getView().byId("fldCUSTGRP").getSelectedKey();
                    oParam["SALESTERM"] = this.getView().byId("fldSALESTERM").getSelectedKey();
                    oParam["SALESTERMTEXT"] = this.getView().byId("fldSALESTERMTEXT").getValue();
                    oParam["DOCDT"] = sapDateFormat.format(new Date(this.getView().byId("fldDOCDT").getValue())) + "T00:00:00"; //"2023-01-26T00:00:00"; //
                    oParam["POSTDT"] = sapDateFormat.format(new Date(this.getView().byId("fldPOSTDT").getValue())) + "T00:00:00"; 
                    oParam["EVERS"] = this.getView().byId("fldEVERS").getSelectedKey();
                    oParam["DEST"] = this.getView().byId("fldDEST").getSelectedKey();
                    oParam["COO"] = this.getView().byId("fldCOO").getValue();
                    oParam["REFDOCNO"] = this.getView().byId("fldREFDOCNO").getValue();
                    oParam["STATUS"] = this.getView().byId("fldSTATUS").getSelectedKey();
                    oParam["REMARKS"] = this.getView().byId("fldREMARKS").getValue();
                    oParam["MULTISOLDTO"] = this.getView().byId("fldMULTISOLDTO").getSelected() === true ? "X" : "";

                    if (this.getView().byId("fldPLANDLVDT").getValue() !== "") {
                        oParam["PLANDLVDT"] = sapDateFormat.format(new Date(this.getView().byId("fldPLANDLVDT").getValue())) + "T00:00:00";
                    } 
                    else { oParam["PLANDLVDT"] = null; }

                    if (this.getView().byId("fldINDCDT").getValue() !== "") {
                        oParam["INDCDT"] = sapDateFormat.format(new Date(this.getView().byId("fldINDCDT").getValue())) + "T00:00:00";
                    }
                    else { oParam["INDCDT"] = null; }

                    if (this.getView().byId("fldEXFTYDT").getValue() !== "") {
                        oParam["EXFTYDT"] = sapDateFormat.format(new Date(this.getView().byId("fldEXFTYDT").getValue())) + "T00:00:00";
                    }
                    else { oParam["EXFTYDT"] = null; }

                    if (this.getView().byId("fldDEPARTDT").getValue() !== "") {
                        oParam["DEPARTDT"] = sapDateFormat.format(new Date(this.getView().byId("fldDEPARTDT").getValue())) + "T00:00:00";
                    }
                    else { oParam["DEPARTDT"] = null; }

                    if (this.getView().byId("fldREFDOCDT").getValue() !== "") {
                        oParam["REFDOCDT"] = sapDateFormat.format(new Date(this.getView().byId("fldREFDOCDT").getValue())) + "T00:00:00";
                    }
                    else { oParam["REFDOCDT"] = null; }

                    if (this.getView().byId("fldTOTALNOPKG").getValue() !== "") {
                        oParam["TOTALNOPKG"] = +this.getView().byId("fldTOTALNOPKG").getValue();
                    }
                    else { oParam["TOTALNOPKG"] = null; }

                    if (this.getView().byId("fldREVNO").getValue() !== "") {
                        oParam["REVNO"] = +this.getView().byId("fldREVNO").getValue();
                    }
                    else { oParam["REVNO"] = null; }
                    console.log(oParam)
                    if (this._dataMode === "NEW") {
                        this._oModel.create("/HeaderSet", oParam, {
                            method: "POST",
                            success: function (oData, oResponse) {
                                var oMessage = JSON.parse(oResponse.headers["sap-message"]);

                                if (oMessage.severity === "success") {
                                    me.getView().byId("fldDLVNO").setValue(oMessage.message);
                                    me.setHeaderFieldsEditable(false);
        
                                    me.getView().byId("btnEditHdr").setVisible(true);
                                    me.getView().byId("btnRefreshHdr").setVisible(true);
                                    me.getView().byId("btnSaveHdr").setVisible(false);
                                    me.getView().byId("btnCancelHdr").setVisible(false);
                                    me.getView().byId("btnComplete").setVisible(true);
            
                                    me.getView().byId("btnEditShipDtl").setEnabled(true);
                                    me.getView().byId("btnRefreshShipDtl").setEnabled(true);
                                
                                    var oIconTabBar = me.byId("itbDetail");
                                    oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));
                                    
                                    if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }

                                    // me.unLock();
                                    me._dataMode = "READ";
                                    me.getOwnerComponent().getModel("UI_MODEL").setProperty("/activeDlv", oMessage.message);
                                    me.getOwnerComponent().getModel("UI_MODEL").setProperty("/refresh", true);
                                    me.byId("itbDetail").setVisible(true);
                                    Common.closeProcessingDialog(me);
                                    me.getHeaderData(false);
                                    me.getDelvStatusData(false); 
                                }
                                else {
                                    MessageBox.information(oMessage.message);
                                }
                            },
                            error: function (oError) {
                                Common.closeProcessingDialog(me);
                            }
                        });
                    }
                    else {
                        this._oModel.setHeaders({ section: "DELVHDR" });

                        this._oModel.update("/HeaderSet('" + this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv + "')", oParam, {
                            method: "PUT",
                            success: function (oData, oResponse) {
                                MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_DATA_SAVE"]);

                                me.setHeaderFieldsEditable(false);
        
                                me.getView().byId("btnEditHdr").setVisible(true);
                                me.getView().byId("btnRefreshHdr").setVisible(true);
                                me.getView().byId("btnSaveHdr").setVisible(false);
                                me.getView().byId("btnCancelHdr").setVisible(false);
                                me.getView().byId("btnComplete").setVisible(true);
        
                                me.getView().byId("btnEditShipDtl").setEnabled(true);
                                me.getView().byId("btnRefreshShipDtl").setEnabled(true);
                                me.getView().byId("btnAddDelvSched").setEnabled(true);
                                me.getView().byId("btnDeleteDelvSched").setEnabled(true);
                                // me.getView().byId("btnCompleteDelvSched").setEnabled(true);
                                me.getView().byId("btnRefreshDelvSched").setEnabled(true);
                                
                                var oIconTabBar = me.byId("itbDetail");
                                oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));

                                if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }

                                me.unLock();
                                me._dataMode = "READ";
                                me.getOwnerComponent().getModel("UI_MODEL").setProperty("/refresh", true);
                                Common.closeProcessingDialog(me);
                            },
                            error: function (oError) {
                                Common.closeProcessingDialog(me);
                            }
                        });
                    }
                }
                else if (this._sActiveTable === "shipDtlForm") {
                    if (!this._bHeaderChanged) {
                        MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_NO_DATA_MODIFIED"]);
                        return;
                    }

                    if (this._validationErrors.length > 0) {
                        MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_CHECK_INVALID_ENTRIES"]);
                        return;
                    }
                    
                    this.byId("shipForm").getFormContainers().forEach(item => {
                        item.getFormElements().forEach(e => {
                            var sFieldName = "";
        
                            if (e.getFields()[0].getBindingInfo("value") !== undefined) {
                                sFieldName = e.getFields()[0].getBindingInfo("value").parts[0].path.replace("/","");
                            }
                            else if (e.getFields()[0].getBindingInfo("selected") !== undefined) {
                                sFieldName = "";
                            }
        
                            if (sFieldName !== "") {
                                var oColumn = this._aColumns["delvHdr"].filter(fItem => fItem.ColumnName === sFieldName);

                                if (oColumn[0].Mandatory) {
                                    if (oColumn[0].DataType === "DATETIME") {
                                        if (e.getFields()[0].getProperty("value") === "") {
                                            aReqFields.push(e.getLabel().getProperty("text"));
                                            bProceed = false;
                                        }
                                    }
                                    else {
                                        if (oColumn[0].Mandatory && !(e.getFields()[0].getProperty("value") !== "" || (e.getFields()[0].getProperty("selectedKey") !== undefined && e.getFields()[0].getProperty("selectedKey") !== ""))) {
                                            aReqFields.push(e.getLabel().getProperty("text"));
                                            bProceed = false;
                                        }
                                    }
                                }
                            }
                        })
                    })
                    
                    if (!bProceed) {
                        MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_INPUT_REQD_FIELDS"]);
                        return;
                    }

                    Common.openProcessingDialog(this);
                    this._oModel.setHeaders({ section: "SHIPDTL" });

                    oParam["VESSEL"] = this.getView().byId("fldVESSEL").getValue();
                    oParam["VOYAGE"] = this.getView().byId("fldVOYAGE").getValue();
                    oParam["CARRIER"] = this.getView().byId("fldCARRIER").getValue();
                    oParam["FORWRDR"] = this.getView().byId("fldFORWRDR").getValue();
                    oParam["FORREFNO"] = this.getView().byId("fldFORREFNO").getValue();
                    oParam["BOOKINGNO"] = this.getView().byId("fldBOOKINGNO").getValue();
                    oParam["PORTLD"] = this.getView().byId("fldPORTLD").getValue();
                    oParam["PORTDIS"] = this.getView().byId("fldPORTDIS").getValue();
                    // oParam["ETD"] = this.getView().byId("fldETD").getValue();
                    // oParam["ETA"] = this.getView().byId("fldETA").getValue();
                    oParam["HBL"] = this.getView().byId("fldHBL").getValue();
                    // oParam["HBLDT"] = this.getView().byId("fldHBLDT").getValue();
                    oParam["MBL"] = this.getView().byId("fldMBL").getValue();
                    // oParam["MBLDT"] = this.getView().byId("fldMBLDT").getValue();
                    oParam["CONSIGN"] = this.getView().byId("fldCONSIGN").getSelectedKey();
                    oParam["MESSRS"] = this.getView().byId("fldMESSRS").getSelectedKey();
                    oParam["INVPRE"] = this.getView().byId("fldINVPRE").getValue();
                    oParam["INVNO"] = this.getView().byId("fldINVNO").getValue();
                    oParam["INVSUF"] = this.getView().byId("fldINVSUF").getValue();
                    // oParam["INVDT"] = this.getView().byId("fldINVDT").getValue();
                    oParam["ACCTTYP"] = this.getView().byId("fldACCTTYP").getSelectedKey();
                    oParam["IMPTR"] = this.getView().byId("fldIMPTR").getValue();
                    oParam["EXPTR"] = this.getView().byId("fldEXPTR").getValue();
                    oParam["FINLDEST"] = this.getView().byId("fldFINLDEST").getValue();
                    oParam["CONTTYP"] = this.getView().byId("fldCONTTYP").getValue();
                    oParam["CONTNO"] = this.getView().byId("fldCONTNO").getValue();
                    oParam["SEALNO"] = this.getView().byId("fldSEALNO").getValue();
                    oParam["GRSWT"] = this.getView().byId("fldGRSWT").getValue();
                    oParam["NETWT"] = this.getView().byId("fldNETWT").getValue();
                    oParam["WTUOM"] = this.getView().byId("fldWTUOM").getSelectedKey();
                    oParam["VOLUME"] = this.getView().byId("fldVOLUME").getValue();
                    oParam["VOLUOM"] = this.getView().byId("fldVOLUOM").getSelectedKey();
                    oParam["NP1"] = this.getView().byId("fldNP1").getValue();
                    oParam["NP2"] = this.getView().byId("fldNP2").getValue();
                    oParam["NP3"] = this.getView().byId("fldNP3").getValue();
                    oParam["NP4"] = this.getView().byId("fldNP4").getValue();
                    oParam["EXPLICNO"] = this.getView().byId("fldEXPLICNO").getValue();
                    // oParam["EXPLICDT"] = this.getView().byId("fldEXPLICDT").getValue();
                    oParam["INSPOL"] = this.getView().byId("fldINSPOL").getValue();
                    oParam["TCINVNO"] = this.getView().byId("fldTCINVNO").getValue();

                    if (this.getView().byId("fldGRSWT").getValue() === "") {
                        oParam["GRSWT"] = "0.000";
                    } 

                    if (this.getView().byId("fldNETWT").getValue() === "") {
                        oParam["NETWT"] = "0.000";
                    } 

                    if (this.getView().byId("fldVOLUME").getValue() === "") {
                        oParam["VOLUME"] = "0.000";
                    } 

                    if (this.getView().byId("fldETD").getValue() !== "") {
                        oParam["ETD"] = sapDateFormat.format(new Date(this.getView().byId("fldETD").getValue())) + "T00:00:00";
                    } 
                    else { oParam["ETD"] = null; }

                    if (this.getView().byId("fldETA").getValue() !== "") {
                        oParam["ETA"] = sapDateFormat.format(new Date(this.getView().byId("fldETA").getValue())) + "T00:00:00";
                    } 
                    else { oParam["ETA"] = null; }

                    if (this.getView().byId("fldHBLDT").getValue() !== "") {
                        oParam["HBLDT"] = sapDateFormat.format(new Date(this.getView().byId("fldHBLDT").getValue())) + "T00:00:00";
                    } 
                    else { oParam["HBLDT"] = null; }

                    if (this.getView().byId("fldMBLDT").getValue() !== "") {
                        oParam["MBLDT"] = sapDateFormat.format(new Date(this.getView().byId("fldMBLDT").getValue())) + "T00:00:00";
                    } 
                    else { oParam["MBLDT"] = null; }

                    if (this.getView().byId("fldINVDT").getValue() !== "") {
                        oParam["INVDT"] = sapDateFormat.format(new Date(this.getView().byId("fldINVDT").getValue())) + "T00:00:00";
                    } 
                    else { oParam["INVDT"] = null; }

                    if (this.getView().byId("fldEXPLICDT").getValue() !== "") {
                        oParam["EXPLICDT"] = sapDateFormat.format(new Date(this.getView().byId("fldEXPLICDT").getValue())) + "T00:00:00";
                    } 
                    else { oParam["EXPLICDT"] = null; }
                    console.log(oParam)
                    this._oModel.update("/HeaderSet('" + this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv + "')", oParam, {
                        method: "PUT",
                        success: function (oData, oResponse) {
                            MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_DATA_SAVE"]);

                            me.setShipDetailFieldsEditable(false);

                            me.getView().byId("btnEditShipDtl").setVisible(true);
                            me.getView().byId("btnRefreshShipDtl").setVisible(true);
                            me.getView().byId("btnSaveShipDtl").setVisible(false);
                            me.getView().byId("btnCancelShipDtl").setVisible(false);
            
                            me.getView().byId("btnEditHdr").setEnabled(true);
                            me.getView().byId("btnRefreshHdr").setEnabled(true);
                            me.getView().byId("btnComplete").setEnabled(true);

                            var oIconTabBar = me.byId("itbDetail");
                            oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));

                            if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }

                            if (me.getView().byId("fldGRSWT").getValue() === "") {
                                me.getView().byId("fldGRSWT").setValue("0.000");
                            } 

                            if (me.getView().byId("fldNETWT").getValue() === "") {
                                me.getView().byId("fldNETWT").setValue("0.000");
                            } 

                            if (me.getView().byId("fldVOLUME").getValue() === "") {
                                me.getView().byId("fldVOLUME").setValue("0.000");
                            } 

                            me.unLock();
                            me._dataMode = "READ";

                            Common.closeProcessingDialog(me);
                        },
                        error: function (oError) {
                            Common.closeProcessingDialog(me);
                        }
                    });
                }
                else if (this._sActiveTable === "delvSchedTab") {
                    if (oTable.getModel().getData().rows.length > 0) {
                        Common.openProcessingDialog(this);

                        this._oModel.setHeaders({ 
                            dlvno: this.getView().byId("fldDLVNO").getValue(),
                            docdt: dateFormat2.format(new Date(this.getView().byId("fldDOCDT").getValue()))
                        });
                        
                        this._oModel.setUseBatch(true);
                        this._oModel.setDeferredGroups(["update"]);

                        var mParameters = { groupId:"update" }

                        oTable.getModel().getData().rows.forEach(item => {
                            var param = {};

                            this._aColumns[this._sActiveTable.replace("Tab","")].forEach(col => {
                                if (item[col.ColumnName].toString() !== "") {
                                    if (col.DataType === "DATETIME") {
                                        param[col.ColumnName] = item[col.ColumnName] === "" ? "" : sapDateFormat.format(new Date(item[col.ColumnName])) + "T00:00:00";                                    
                                    } 
                                    else if (col.DataType === "BOOLEAN") {
                                        param[col.ColumnName] = item[col.ColumnName] === true ? "X" : "";
                                    }
                                    else if (col.DataType === "NUMBER" && col.Decimal === 0) {
                                        param[col.ColumnName] = +item[col.ColumnName];
                                    }
                                    else {
                                        param[col.ColumnName] = item[col.ColumnName] === "" ? "" : item[col.ColumnName] + "";
                                    }
                                }
                            })

                            this._oModel.create("/DelvSchedSet", param, mParameters);
                        })
                        
                        this._oModel.submitChanges({
                            groupId: "update",
                            success: function (oData, oResponse) {
                                MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_DATA_SAVE"]);

                                me.getView().byId("btnAddDelvSched").setVisible(true);
                                me.getView().byId("btnDeleteDelvSched").setVisible(true);
                                // me.getView().byId("btnCompleteDelvSched").setVisible(true);
                                me.getView().byId("btnRefreshDelvSched").setVisible(true);
                                me.getView().byId("btnAddNewDelvSched").setVisible(false);
                                me.getView().byId("btnRemoveNewDelvSched").setVisible(false);
                                me.getView().byId("btnSavedDelvSched").setVisible(false);
                                me.getView().byId("btnCancelDelvSched").setVisible(false);
                
                                me.getView().byId("btnEditHdr").setEnabled(true);
                                me.getView().byId("btnRefreshHdr").setEnabled(true);
                                me.getView().byId("btnComplete").setEnabled(true);
                
                                var oIconTabBar = me.byId("itbDetail");
                                oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));
                
                                me._dataMode = "READ";
                                me.getOwnerComponent().getModel("UI_MODEL").setProperty("/refresh", true);

                                me.byId("delvSchedTab").getModel().setProperty("/rows", oTable.getModel().getData().rows.concat(me._aDataBeforeChange));
                                me.byId("delvSchedTab").bindRows("/rows");

                                if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }

                                me.getDelvDetailData();
                                me.unLock();

                                Common.closeProcessingDialog(me);
                            },
                            error: function () {
                                Common.closeProcessingDialog(me);
                            }
                        })
                    }
                    else {
                        MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_NO_DATA_SAVE"])
                    }
                }
                else if (this._sActiveTable === "delvDtlTab") {
                    if (!this._bDelvDtlChanged) {
                        MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_NO_DATA_MODIFIED"]);
                        return;
                    }

                    if (this._validationErrors.length > 0) {
                        MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_CHECK_INVALID_ENTRIES"]);
                        return;
                    }

                    var bProceed = true;
                    var aEditedRows = this.byId(this._sActiveTable).getModel().getData().rows.filter(item => item.EDITED === true);

                    aEditedRows.forEach(item => {
                        if (item.DLVQTYBSE > item.AVAILQTY) {
                            bProceed = false;
                        }
                    })

                    if (!bProceed) {
                        MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_CHECK_INVALID_DLVQTYBSE"]);
                        return;
                    }

                    Common.openProcessingDialog(me, "Processing...");

                    var sEntitySet = "/DelvDetailSet(";

                    this._oModel.setUseBatch(true);
                    this._oModel.setDeferredGroups(["update"]);

                    var mParameters = {
                        "groupId":"update"
                    }

                    aEditedRows.forEach(item => {
                        var entitySet = sEntitySet;
                        var param = {};
                        var iKeyCount = this._aColumns[this._sActiveTable.replace("Tab","")].filter(col => col.Key === "X").length;
                        var itemValue;

                        this._aColumns[this._sActiveTable.replace("Tab","")].forEach(col => {
                            if (col.DataType === "DATETIME") {
                                itemValue = sapDateFormat.format(new Date(item[col.ColumnName])) + "T00:00:00";
                            } 
                            else if (col.DataType === "BOOLEAN") {
                                itemValue = item[col.ColumnName] === true ? "X" : "";
                            }
                            else {
                                itemValue = item[col.ColumnName];
                            }

                            if (col.Editable) {
                                param[col.ColumnName] = itemValue;
                            }

                            if (iKeyCount === 1) {
                                if (col.Key === "X")
                                    entitySet += "'" + itemValue + "'"
                            }
                            else if (iKeyCount > 1) {
                                if (col.Key === "X") {
                                    entitySet += col.ColumnName + "='" + itemValue + "',"
                                }
                            }
                        })

                        if (iKeyCount > 1) entitySet = entitySet.substring(0, entitySet.length - 1);
                        entitySet += ")";

                        this._oModel.update(entitySet, param, mParameters);
                    })
                    
                    this._oModel.submitChanges({
                        groupId: "update",
                        success: function (oData, oResponse) {
                            MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_DATA_SAVE"]);

                            me.getView().byId("btnEditDelvDtl").setVisible(true);
                            me.getView().byId("btnRefreshDelvDtl").setVisible(true);
                            me.getView().byId("btnSaveDelvDtl").setVisible(false);
                            me.getView().byId("btnCancelDelvDtl").setVisible(false);
                            me.getView().byId("btnTabLayoutDelvDtl").setVisible(true);
                            me.getView().byId("btnDataWrapDelvDtl").setVisible(true);
            
                            me.getView().byId("btnEditHdr").setEnabled(true);
                            me.getView().byId("btnRefreshHdr").setEnabled(true);
                            me.getView().byId("btnComplete").setEnabled(true);
            
                            me.setRowReadMode();

                            var oIconTabBar = me.byId("itbDetail");
                            oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));
            
                            if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }
                            
                            me._dataMode = "READ";
                            me.unLock();

                            Common.closeProcessingDialog(me);
                        },
                        error: function () {
                            Common.closeProcessingDialog(me);
                        }
                    })
                }
            }
        },

        onRefresh: function (oEvent) {
            this._sActiveTable = oEvent.getSource().data("TableId");
            this.refreshData();
        },

        refreshData() {
            if (this._dataMode === "READ") {
                if (this._sActiveTable === "delvHdrForm") {
                    this.getHeaderData(true);
                }
                else if (this._sActiveTable === "delvSchedTab") {
                    this.getDelvSchedData();
                }
                else if (this._sActiveTable === "shipDtlForm") {
                    this.getHeaderData(true);
                }
                else if (this._sActiveTable === "delvDtlTab") {
                    this.getDelvDetailData();
                }
                else if (this._sActiveTable === "delvStatTab") {
                    this.getDelvStatusData(true);
                }

                if (this._sActiveTable.substring(this._sActiveTable.length - 3, this._sActiveTable.length) === "Tab") {
                    this._aColFilters = this.byId(this._sActiveTable).getBinding("rows").aFilters;
                    this._aColSorters = this.byId(this._sActiveTable).getBinding("rows").aSorters;
                }
            }
        },
        
        onDelete: function (oEvent) {
            this._sActiveTable = oEvent.getSource().data("TableId");
            this.deleteData();
        },

        async deleteData(){
            if (this._dataMode === "READ") {
                var oTable = this.byId(this._sActiveTable);
                var me = this;
                var vStatus = "";

                if (oTable.getModel().getData().rows.length === 0) {
                    MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_NO_RECORD_TO_DELETE"]);
                    return;
                }

                if (this.getView().byId("fldSTATUS").getSelectedKey() !== "") { vStatus = this.getView().byId("fldSTATUS").getSelectedKey(); }
                else { vStatus = this.getView().getModel("header").getData().STATUS; }

                if (vStatus !== "50") {
                    MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_SHIPDOC_CHANGE_NOT_ALLOW"]);
                    return;
                }

                var bProceed = await this.lock(this);
                if (!bProceed) return;

                if (this._sActiveTable === "delvSchedTab") {
                    if (oTable.getModel().getData().rows.length > 0) {
                        if (vStatus === "50") {
                            var aSelIndices = oTable.getSelectedIndices();
                            var oTmpSelectedIndices = [];
                            var aData = oTable.getModel().getData().rows;

                            if (aSelIndices.length > 0) {
                                MessageBox.confirm(me.getView().getModel("ddtext").getData()["CONF_DELETE_RECORDS"], {
                                    actions: ["Yes", "No"],
                                    onClose: function (sAction) {
                                        if (sAction === "Yes") {
                                            Common.openProcessingDialog(me);

                                            var mParameters = { groupId:"update" }
                
                                            aSelIndices.forEach(item => {
                                                oTmpSelectedIndices.push(oTable.getBinding("rows").aIndices[item])
                                            })
                
                                            aSelIndices = oTmpSelectedIndices;
                
                                            aSelIndices.forEach((item, index) => {
                                                var sEntitySet = "/DelvSchedSet(DLVNO='" + aData.at(item).DLVNO + "',IONO='" + aData.at(item).IONO + "',DLVSEQ=" + aData.at(item).DLVSEQ + ")";
                                                me._oModel.remove(sEntitySet, null, mParameters);
                                            })
                
                                            me._oModel.setUseBatch(true);
                                            me._oModel.setDeferredGroups(["update"]);
                
                                            me._oModel.submitChanges({
                                                groupId: "update",
                                                success: function (oData, oResponse) {
                                                    aSelIndices.sort((a,b) => (a < b ? 1 : -1));
                                                    aSelIndices.forEach((item, index) => {
                                                        var idxToRemove = aData.indexOf(aData.at(item));
                                                        aData.splice(idxToRemove, 1);
                                                    })
                
                                                    me.byId("delvSchedTab").getModel().setProperty("/rows", aData);
                                                    me.byId("delvSchedTab").bindRows("/rows");
                                                    me.getDelvDetailData();
                                                    me.getOwnerComponent().getModel("UI_MODEL").setProperty("/refresh", true);
                
                                                    me.unLock();
                                                    Common.closeProcessingDialog(me);
                                                    MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_DATA_DELETED"]);
                                                },
                                                error: function () {
                                                    Common.closeProcessingDialog(me);
                                                }
                                            }) 
                                        }
                                        else { me.unLock(); }
                                    }
                                });
                            } 
                            else  {
                                me.unLock();
                                MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_SEL_RECORD_TO_DELETE"]);
                            }
                        }
                        else {
                            me.unLock();
                            MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_DLV_DELETE_NOT_ALLOW"]);
                        }
                    }
                    else  {
                        me.unLock();
                        MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_NO_RECORD_TO_DELETE"]);
                    }
                }
            }
        },

        onAddDelvSched: function(oEvent) {
            var oTable = this._AddDelvSchedDialog.getContent()[0];
            var aSelIndices = oTable.getSelectedIndices();
            var oTmpSelectedIndices = [];
            var aData = oTable.getModel().getData().rows;
            var me = this;

            if (aData.length > 0) {
                if (aSelIndices.length > 0) {
                    Common.openProcessingDialog(this);

                    aSelIndices.forEach(item => {
                        oTmpSelectedIndices.push(oTable.getBinding("rows").aIndices[item])
                    })
    
                    aSelIndices = oTmpSelectedIndices;
    
                    aSelIndices.forEach((item, index) => {
                        this._addToDelvSched.push(aData.at(item));
                    })
    
                    aSelIndices.sort((a,b) => (a < b ? 1 : -1));
                    aSelIndices.forEach((item, index) => {
                        var idxToRemove = aData.indexOf(aData.at(item));
                        this._AddDelvSchedDialog.getModel().getData().rows.splice(idxToRemove, 1);
                    })

                    this._AddDelvSchedDialog.getModel().setProperty("/rows", this._AddDelvSchedDialog.getModel().getData().rows);

                    this._oModel.setHeaders({ 
                        dlvno: this.getView().byId("fldDLVNO").getValue(),
                        docdt: dateFormat2.format(new Date(this.getView().byId("fldDOCDT").getValue()))
                    });

                    this._oModel.setUseBatch(true);
                    this._oModel.setDeferredGroups(["update"]);

                    var mParameters = { groupId:"update" }

                    this._addToDelvSched.forEach(item => {
                        var param = {};

                        this._aColumns[this._sActiveTable.replace("Tab","")].forEach(col => {
                            if (item[col.ColumnName].toString() !== "") {
                                if (col.DataType === "DATETIME") {
                                    param[col.ColumnName] = item[col.ColumnName] === "" ? "" : sapDateFormat.format(new Date(item[col.ColumnName])) + "T00:00:00";                                    
                                } 
                                else if (col.DataType === "BOOLEAN") {
                                    param[col.ColumnName] = item[col.ColumnName] === true ? "X" : "";
                                }
                                else if (col.DataType === "NUMBER" && col.Decimal === 0) {
                                    param[col.ColumnName] = +item[col.ColumnName];
                                }
                                else {
                                    param[col.ColumnName] = item[col.ColumnName] === "" ? "" : item[col.ColumnName] + "";
                                }
                            }
                        })

                        this._oModel.create("/DelvSchedSet", param, mParameters);
                    })
                    
                    this._oModel.submitChanges({
                        groupId: "update",
                        success: function (oData, oResponse) {
                            MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_DATA_SAVE"]);

                            me.getOwnerComponent().getModel("UI_MODEL").setProperty("/refresh", true);
                            me._dataMode = "READ";
                            me._AddDelvSchedDialog.close();
                            me.unLock();
                            me.byId("delvSchedTab").getModel().setProperty("/rows", me._addToDelvSched.concat(me._aDataBeforeChange));
                            me.byId("delvSchedTab").bindRows("/rows");
                            me.getDelvDetailData();
                            
                            if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }
                            Common.closeProcessingDialog(me);
                        },
                        error: function (err) {
                            Common.closeProcessingDialog(me);
                            MessageBox.error(err.message);
                        }
                    })                   
                }
                else {
                    MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_NO_SEL_RECORD_TO_PROC"])
                }
            }
            else {
                MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_NO_RECORD_TO_PROC"])
            }            
        },

        onCloseDelvSched: function(oEvent) {
            this._dataMode = "READ";
            this._AddDelvSchedDialog.close();
            this.unLock();
            if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }
        },

        onRemoveNewRow: function(oEvent) {
            var oTable = oEvent.getSource().oParent.oParent;

            if (oTable.getId().indexOf("delvSchedTab") >= 0) {
                var aData = oTable.getModel().getData().rows;

                if (aData.length > 0) {
                    var aSelIndices = oTable.getSelectedIndices();
                    var oTmpSelectedIndices = [];
        
                    if (aSelIndices.length > 0) {
                        aSelIndices.forEach(item => {
                            oTmpSelectedIndices.push(oTable.getBinding("rows").aIndices[item])
                        })
        
                        aSelIndices = oTmpSelectedIndices;       
                        aSelIndices.sort((a,b) => (a < b ? 1 : -1));

                        aSelIndices.forEach((item, index) => {
                            var idxToRemove = aData.indexOf(aData.at(item));
                            console.log(aData.at(item))
                            this._AddDelvSchedDialog.getModel().getData().rows.splice(aData.at(item).ROWINDEX, 0, aData.at(item));

                            aData.splice(idxToRemove, 1);
                        })
                        
                        this.byId("delvSchedTab").getModel().setProperty("/rows", aData);
                        this.byId("delvSchedTab").bindRows("/rows");

                        this._AddDelvSchedDialog.getModel().getData().rows.sort((a,b) => (a.ROWINDEX > b.ROWINDEX ? 1 : -1));
                        this._AddDelvSchedDialog.getModel().setProperty("/rows", this._AddDelvSchedDialog.getModel().getData().rows);
                    }  
                    else {
                        MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_SEL_RECORD_TO_REMOVE"])
                    }
                }
                else {
                    MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_NO_RECORD_TO_REMOVE"])
                }
            }
        },

        onComplete: async function (oEvent) {
            var me = this;
            var aReqFields = [];
            var bProceed = true;
            var vStatus = "";

            // var bProceed = await this.lock(this);
            // if (!bProceed) {
            //     Common.closeProcessingDialog(this);    
            //     return;
            // }

            if (this.getView().byId("fldSTATUS").getSelectedKey() !== "") { vStatus = this.getView().byId("fldSTATUS").getSelectedKey(); }
            else { vStatus = this.getView().getModel("header").getData().STATUS; }

            if (vStatus !== "50") {
                bProceed = false;
                MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_SHIPDOC_CHANGE_NOT_ALLOW"]);
                return;
            }

            this.byId("headerForm").getFormContainers().forEach(item => {
                item.getFormElements().forEach(e => {
                    var sFieldName = "";

                    if (e.getFields()[0].getBindingInfo("value") !== undefined) {
                        sFieldName = e.getFields()[0].getBindingInfo("value").parts[0].path.replace("/","");
                    }
                    else if (e.getFields()[0].getBindingInfo("selected") !== undefined) {
                        sFieldName = "";
                    }

                    if (sFieldName !== "") {
                        var oColumn = this._aColumns["delvHdr"].filter(fItem => fItem.ColumnName === sFieldName);

                        if (oColumn[0].Mandatory) {
                            console.log(e.getFields()[0])
                            if (oColumn[0].DataType === "DATETIME") {
                                if (e.getFields()[0].getProperty("value") === "") {
                                    aReqFields.push(e.getLabel().getProperty("text"));
                                    bProceed = false;
                                }
                            }
                            else {
                                if (oColumn[0].Mandatory && !(e.getFields()[0].getProperty("value") !== "" || (e.getFields()[0].getProperty("selectedKey") !== undefined && e.getFields()[0].getProperty("selectedKey") !== ""))) {
                                    aReqFields.push(e.getLabel().getProperty("text"));
                                    bProceed = false;
                                }
                            }
                        } 
                    }
                })
            })
            
            this.byId("shipForm").getFormContainers().forEach(item => {
                item.getFormElements().forEach(e => {
                    var sFieldName = "";

                    if (e.getFields()[0].getBindingInfo("value") !== undefined) {
                        sFieldName = e.getFields()[0].getBindingInfo("value").parts[0].path.replace("/","");
                    }
                    else if (e.getFields()[0].getBindingInfo("selected") !== undefined) {
                        sFieldName = "";
                    }

                    if (sFieldName !== "") {
                        var oColumn = this._aColumns["delvHdr"].filter(fItem => fItem.ColumnName === sFieldName);

                        if (oColumn[0].Mandatory) {
                            if (oColumn[0].DataType === "DATETIME") {
                                if (e.getFields()[0].getProperty("value") === "") {
                                    aReqFields.push(e.getLabel().getProperty("text"));
                                    bProceed = false;
                                }
                            }
                            else {
                                if (oColumn[0].Mandatory && !(e.getFields()[0].getProperty("value") !== "" || (e.getFields()[0].getProperty("selectedKey") !== undefined && e.getFields()[0].getProperty("selectedKey") !== ""))) {
                                    aReqFields.push(e.getLabel().getProperty("text"));
                                    bProceed = false;
                                }
                            }
                        } 
                    }
                })
            })

            if (!bProceed) {
                // this.unLock();
                MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_INPUT_REQD_FIELDS"] + ": \r\n" + aReqFields.join(", "));
            }
            else {
                this.byId("delvDtlTab").getModel().getData().rows.forEach(item => {
                    if (item.DLVQTYBSE > item.AVAILQTY) {
                        bProceed = false;
                    }
                })

                if (bProceed) {
                    Common.openProcessingDialog(this);
                    
                    bProceed = await this.lock(this);
                    
                    if (!bProceed) {
                        Common.closeProcessingDialog(this);    
                        return;
                    }

                    var oParam = { STATUS: "51" };

                    this._oModel.setHeaders({ section: "STATUS" });

                    this._oModel.update("/HeaderSet('" + this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv + "')", oParam, {
                        method: "PUT",
                        success: function (oData, oResponse) {
                            me.getView().byId("fldSTATUS").setSelectedKey("51");
                            me.getOwnerComponent().getModel("UI_MODEL").setProperty("/refresh", true);
                            me.unLock();
                            me.getHeaderData(false);
                            me.getDelvStatusData(false);
                            Common.closeProcessingDialog(me);
                        },
                        error: function (oError) {
                            me.unLock();
                            Common.closeProcessingDialog(me);
                        }
                    }); 
                }
                else {
                    // this.unLock();
                    MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_DLV_INSUFFICIENT_STOCK"]);
                }
            }
        },

        onTableResize: function(oEvent) {
            var oSplitter = this.byId("splitterMain");
            var oHeaderPane = oSplitter.getRootPaneContainer().getPanes().at(0);
            var oDetailPane = oSplitter.getRootPaneContainer().getPanes().at(1);
            var vFullScreen = oEvent.getSource().data("Fullscreen") === "1" ? true : false;
            var vPart = oEvent.getSource().data("Part");
            var vHeaderSize = oEvent.getSource().data("HeaderSize");
            var vDetailSize = oEvent.getSource().data("DetailSize");

            this._sActiveTable = oEvent.getSource().data("TableId");
            this.getView().getModel("ui").setProperty("/fullscreen/" + vPart, vFullScreen);

            var oHeaderLayoutData = new sap.ui.layout.SplitterLayoutData({
                size: vHeaderSize,
                resizable: !vFullScreen
            });

            var oDetailLayoutData = new sap.ui.layout.SplitterLayoutData({
                size: vDetailSize,
                resizable: !vFullScreen
            });

            document.getElementsByClassName("sapUiLoSplitterBar")[0].setAttribute("style", "display: " + (vFullScreen ? "none" : "flex"));

            oHeaderPane.setLayoutData(oHeaderLayoutData);
            oDetailPane.setLayoutData(oDetailLayoutData);
        },

        setHeaderFieldsEditable(arg) {            
            // this.getView().byId("fldISSPLNT").setEditable(arg);
            // this.getView().byId("fldSOLDTOCUST").setEditable(arg);
            // this.getView().byId("fldBILLTOCUST").setEditable(arg);
            // // this.getView().byId("fldCUSTGRP").setEditable(arg);
            // this.getView().byId("fldSALESTERM").setEditable(arg);
            // this.getView().byId("fldSALESTERMTEXT").setEditable(arg);
            // this.getView().byId("fldDOCDT").setEditable(arg);
            // this.getView().byId("fldPOSTDT").setEditable(arg);
            // this.getView().byId("fldPLANDLVDT").setEditable(arg);
            // this.getView().byId("fldINDCDT").setEditable(arg);
            // this.getView().byId("fldEXFTYDT").setEditable(arg);
            // this.getView().byId("fldDEPARTDT").setEditable(arg);
            // this.getView().byId("fldEVERS").setEditable(arg);
            // this.getView().byId("fldDEST").setEditable(arg);
            // this.getView().byId("fldCOO").setEditable(arg);
            // this.getView().byId("fldTOTALNOPKG").setEditable(arg);
            // this.getView().byId("fldREFDOCNO").setEditable(arg);
            // this.getView().byId("fldREFDOCDT").setEditable(arg);
            // this.getView().byId("fldREVNO").setEditable(arg);
            this.getView().byId("fldMULTISOLDTO").setEditable(arg);
            // this.getView().byId("fldREMARKS").setEditable(arg);

            this.byId("headerForm").getFormContainers().forEach(item => {
                item.getFormElements().forEach(e => {
                    var sFieldName = "";

                    if (e.getFields()[0].getBindingInfo("value") !== undefined) {
                        sFieldName = e.getFields()[0].getBindingInfo("value").parts[0].path.replace("/","");
                    }
                    else if (e.getFields()[0].getBindingInfo("selected") !== undefined) {
                        sFieldName = e.getFields()[0].getBindingInfo("selected").parts[0].path.replace("/","");
                    }

                    if (!arg) {
                        if (e.mAggregations.label.sId !== undefined) {
                            e.mAggregations.label.setProperty("required", arg);
                        }

                        this.getView().byId("fld" + sFieldName).setEditable(arg);
                    }
                    else {
                        // console.log(this._aColumns["delvHdr"])
                        var oColumn = this._aColumns["delvHdr"].filter(fItem => fItem.ColumnName === sFieldName);

                        if (oColumn.length > 0) {
                            if (e.mAggregations.label.sId !== undefined) {
                                if (oColumn[0].Mandatory) {
                                    e.mAggregations.label.setProperty("required", arg);
                                }   
                            }

                            if (oColumn[0].Editable) {
                                this.getView().byId("fld" + sFieldName).setEditable(arg);
                            }
                        }                        
                    }

                    // console.log(e.getFields()[0].getBindingInfo("value").parts[0].path.replace("/",""))                   
                    // if (e.mAggregations.label.sId !== undefined) {
                    //     e.mAggregations.label.setProperty("required", arg);
                    // }
                })
            })

            // if (arg) {
            //     TableValueHelp.setFormSuggestion(this, "header");
            // }
        },

        setShipDetailFieldsEditable(arg) {
            // this.getView().byId("fldVESSEL").setEditable(arg);
            // this.getView().byId("fldVOYAGE").setEditable(arg);
            // this.getView().byId("fldCARRIER").setEditable(arg);
            // this.getView().byId("fldFORWRDR").setEditable(arg);
            // this.getView().byId("fldFORREFNO").setEditable(arg);
            // this.getView().byId("fldBOOKINGNO").setEditable(arg);
            // this.getView().byId("fldPORTLD").setEditable(arg);
            // this.getView().byId("fldPORTDIS").setEditable(arg);
            // this.getView().byId("fldETD").setEditable(arg);
            // this.getView().byId("fldETA").setEditable(arg);
            // this.getView().byId("fldHBL").setEditable(arg);
            // this.getView().byId("fldHBLDT").setEditable(arg);
            // this.getView().byId("fldMBL").setEditable(arg);
            // this.getView().byId("fldMBLDT").setEditable(arg);
            // this.getView().byId("fldCONSIGN").setEditable(arg);
            // this.getView().byId("fldMESSRS").setEditable(arg);
            // // this.getView().byId("fldINVPRE").setEditable(arg);
            // this.getView().byId("fldINVNO").setEditable(arg);
            // this.getView().byId("fldINVSUF").setEditable(arg);
            // this.getView().byId("fldINVDT").setEditable(arg);
            // this.getView().byId("fldACCTTYP").setEditable(arg);
            // this.getView().byId("fldIMPTR").setEditable(arg);
            // this.getView().byId("fldEXPTR").setEditable(arg);
            // this.getView().byId("fldFINLDEST").setEditable(arg);
            // this.getView().byId("fldCONTTYP").setEditable(arg);
            // this.getView().byId("fldCONTNO").setEditable(arg);
            // this.getView().byId("fldSEALNO").setEditable(arg);
            // this.getView().byId("fldGRSWT").setEditable(arg);
            // this.getView().byId("fldNETWT").setEditable(arg);
            // this.getView().byId("fldWTUOM").setEditable(arg);
            // this.getView().byId("fldVOLUME").setEditable(arg);
            // this.getView().byId("fldVOLUOM").setEditable(arg);
            // this.getView().byId("fldNP1").setEditable(arg);
            // this.getView().byId("fldNP2").setEditable(arg);
            // this.getView().byId("fldNP3").setEditable(arg);
            // this.getView().byId("fldNP4").setEditable(arg);
            // this.getView().byId("fldEXPLICNO").setEditable(arg);
            // this.getView().byId("fldEXPLICDT").setEditable(arg);
            // this.getView().byId("fldINSPOL").setEditable(arg);
            // this.getView().byId("fldTCINVNO").setEditable(arg);

            this.byId("shipForm").getFormContainers().forEach(item => {
                item.getFormElements().forEach(e => {
                    var sFieldName = "";

                    if (e.getFields()[0].getBindingInfo("value") !== undefined) {
                        sFieldName = e.getFields()[0].getBindingInfo("value").parts[0].path.replace("/","");
                    }
                    else if (e.getFields()[0].getBindingInfo("selected") !== undefined) {
                        sFieldName = e.getFields()[0].getBindingInfo("selected").parts[0].path.replace("/","");
                    }

                    if (!arg) {
                        if (e.mAggregations.label.sId !== undefined) {
                            e.mAggregations.label.setProperty("required", arg);
                        }

                        this.getView().byId("fld" + sFieldName).setEditable(arg);
                    }
                    else {
                        var oColumn = this._aColumns["delvHdr"].filter(fItem => fItem.ColumnName === sFieldName);

                        if (oColumn.length > 0) {
                            if (e.mAggregations.label.sId !== undefined) {       
                                if (oColumn[0].Mandatory) {
                                    e.mAggregations.label.setProperty("required", arg);
                                }   
                            }

                            if (oColumn[0].Editable) {
                                this.getView().byId("fld" + sFieldName).setEditable(arg);
                            }
                        }                        
                    }

                    // console.log(e.getFields()[0].getBindingInfo("value").parts[0].path.replace("/",""))                   
                    // if (e.mAggregations.label.sId !== undefined) {
                    //     e.mAggregations.label.setProperty("required", arg);
                    // }
                })
            })
        },

        setRowEditMode() {
            var oTable = this.byId(this._sActiveTable);
            
            var oInputEventDelegate = {
                onkeydown: function(oEvent) {
                    me.onInputKeyDown(oEvent);
                },
            };

            oTable.getColumns().forEach((col, idx) => {
                var sColName = "";

                if (col.mAggregations.template.mBindingInfos.text !== undefined) {
                    sColName = col.mAggregations.template.mBindingInfos.text.parts[0].path;
                }
                else if (col.mAggregations.template.mBindingInfos.selected !== undefined) {
                    sColName = col.mAggregations.template.mBindingInfos.selected.parts[0].path;
                }

                this._aColumns[this._sActiveTable.replace("Tab","")].filter(item => item.ColumnName === sColName)
                    .forEach(ci => {
                        if (ci.Editable) {
                            col.setTemplate(new sap.m.Input({
                                type: sap.m.InputType.Number,
                                textAlign: sap.ui.core.TextAlign.Right,
                                value: {
                                    path: sColName,
                                    formatOptions: {
                                        minFractionDigits: ci.Decimal,
                                        maxFractionDigits: ci.Decimal
                                    },
                                    constraints: {
                                        precision: ci.Length,
                                        scale: ci.Decimal
                                    }
                                },
                                liveChange: this.onNumberLiveChange.bind(this)
                            }).addEventDelegate(oInputEventDelegate));
                        }
                    })
            })
        },

        setRowReadMode() {
            var oTable = this.byId(this._sActiveTable);
            var sColName = "";

            oTable.getColumns().forEach((col, idx) => {
                if (col.mAggregations.template.mBindingInfos.text !== undefined) {
                    sColName = col.mAggregations.template.mBindingInfos.text.parts[0].path;
                }
                else if (col.mAggregations.template.mBindingInfos.value !== undefined) {
                    sColName = col.mAggregations.template.mBindingInfos.value.parts[0].path;
                }

                this._aColumns[this._sActiveTable.replace("Tab","")].filter(item => item.ColumnName === sColName)
                    .forEach(ci => {
                        if (ci.DataType === "NUMBER") {
                            col.setTemplate(new sap.m.Text({
                                text: "{" + sColName + "}",
                                wrapping: false,
                                tooltip: "{" + sColName + "}"
                            }));
                        }
                    })
            })

            this.byId(this._sActiveTable).getModel().getData().rows.forEach(item => item.EDITED = false);
        },

        handleSuggestion: function(oEvent) {
            var me = this;
            var oInput = oEvent.getSource();
            var sModel = oInput.getBindingInfo("value").parts[0].model;
            var sInputField = oInput.getBindingInfo("value").parts[0].path;
            var oInputCtx = oEvent.getSource().getBindingContext(sModel);
            var sRowPath = oInputCtx.getPath();
            var sGroup = oInputCtx.getModel().getProperty(sRowPath + '/GROUP');

            if (sInputField === "PAYTERMS" || sInputField === "INCOTERMS" || sInputField === "DESTINATION") {
                // console.log(oInput.getSuggestionItems())
                if (oInput.getSuggestionItems().length === 0) { 
                    var oData = me.getView().getModel("payterms").getData()[sGroup];
                    var sKey = "";
                    // console.log(oData);
                    if (sInputField === "PAYTERMS") { 
                        sKey = "ZTERM";
                    }
                    else if (sInputField === "INCOTERMS") { 
                        sKey = "INCO1";
                    }
                    else if (sInputField === "DESTINATION") {
                        sKey = "INCO2";
                    }
                    
                    oInput.bindAggregation("suggestionItems", {
                        path: "payterms>/" + sGroup,
                        length: 10000,
                        template: new sap.ui.core.ListItem({
                            key: "{payterms>" + sKey + "}",
                            text: "{payterms>" + sKey + "}"
                        }),
                        templateShareable: false
                    });
                }
            }
        },

        onCloseConfirmDialog: function(oEvent) {
            if (this._ConfirmDialog.getModel().getData().Process === "header-cancel") {
                this.setHeaderFieldsEditable(false);

                this.getView().byId("btnEditHdr").setVisible(true);
                this.getView().byId("btnRefreshHdr").setVisible(true);
                this.getView().byId("btnSaveHdr").setVisible(false);
                this.getView().byId("btnCancelHdr").setVisible(false);
                this.getView().byId("btnComplete").setVisible(true);

                this.getView().byId("btnEditShipDtl").setEnabled(true);
                this.getView().byId("btnRefreshShipDtl").setEnabled(true);
                this.getView().byId("btnAddDelvSched").setEnabled(true);
                this.getView().byId("btnDeleteDelvSched").setEnabled(true);
                this.getView().byId("btnRefreshDelvSched").setEnabled(true);

                var oHeaderData = this._oDataBeforeChange;
                this.getView().setModel(new JSONModel(oHeaderData), "header");
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "shipdtl-cancel") {
                this.setShipDetailFieldsEditable(false);

                this.getView().byId("btnEditShipDtl").setVisible(true);
                this.getView().byId("btnRefreshShipDtl").setVisible(true);
                this.getView().byId("btnSaveShipDtl").setVisible(false);
                this.getView().byId("btnCancelShipDtl").setVisible(false);

                this.getView().byId("btnEditHdr").setEnabled(true);
                this.getView().byId("btnRefreshHdr").setEnabled(true);
                this.getView().byId("btnComplete").setEnabled(true);

                var oHeaderData = this._oDataBeforeChange;
                this.getView().setModel(new JSONModel(oHeaderData), "header");
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "delvsched-cancel") {
                var oTable = this.byId("delvSchedTab");

                this.getView().byId("btnAddDelvSched").setVisible(true);
                this.getView().byId("btnDeleteDelvSched").setVisible(true);
                this.getView().byId("btnRefreshDelvSched").setVisible(true);
                this.getView().byId("btnAddNewDelvSched").setVisible(false);
                this.getView().byId("btnRemoveNewDelvSched").setVisible(false);
                this.getView().byId("btnSavedDelvSched").setVisible(false);
                this.getView().byId("btnCancelDelvSched").setVisible(false);

                this.getView().byId("btnEditHdr").setEnabled(true);
                this.getView().byId("btnRefreshHdr").setEnabled(true);
                this.getView().byId("btnComplete").setEnabled(true);
                
                oTable.getModel().setProperty("/rows", this._aDataBeforeChange);
                oTable.bindRows("/rows");

                if (this._aColSorters.length > 0) { this.setColumnSorters("delvSchedTab"); }  
                TableFilter.applyColFilters("delvSchedTab", me);
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "delvdtl-cancel") {
                var oTable = this.byId("delvDtlTab");

                this.getView().byId("btnEditDelvDtl").setVisible(true);
                this.getView().byId("btnRefreshDelvDtl").setVisible(true);
                this.getView().byId("btnSaveDelvDtl").setVisible(false);
                this.getView().byId("btnCancelDelvDtl").setVisible(false);
                this.getView().byId("btnTabLayoutDelvDtl").setVisible(true);
                this.getView().byId("btnDataWrapDelvDtl").setVisible(true);

                this.getView().byId("btnEditHdr").setEnabled(true);
                this.getView().byId("btnRefreshHdr").setEnabled(true);
                this.getView().byId("btnComplete").setEnabled(true);

                this.setRowReadMode();
                
                oTable.getModel().setProperty("/rows", this._aDataBeforeChange);
                oTable.bindRows("/rows");

                if (this._aColSorters.length > 0) { this.setColumnSorters("delvDtlTab"); }
                TableFilter.applyColFilters("delvDtlTab", me);
            }

            var oIconTabBar = me.byId("itbDetail");
            oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));

            this._ConfirmDialog.close();

            if (this._ConfirmDialog.getModel().getData().Process === "header-cancel" && this._dataMode === "NEW") {
                var oHistory, sPreviousHash;
            
                if (sap.ui.core.routing.History !== undefined) {
                    oHistory = sap.ui.core.routing.History.getInstance();
                    sPreviousHash = oHistory.getPreviousHash();
                }
    
                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else { 
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                    oRouter.navTo("RouteMain", {}, true /*no history*/);
                }
            }
            else { this.unLock(); }

            this._dataMode = "READ";

            if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }
        },  

        onCancelConfirmDialog: function(oEvent) {
            this._ConfirmDialog.close();
        },

        onCancelExtendPODialog: function(oEvent){
            this.loadExtendPODialog.close();
        },

        handleValueHelp: function(oEvent) {            
            var oSource = oEvent.getSource();
            var sModel = oSource.getBindingInfo("value").parts[0].model;
            var oData = [];
            var sTitle = "";
            
            this._inputId = oSource.getId();
            this._inputValue = oSource.getValue();
            this._inputSource = oSource;
            
            if (sModel === "header") {
                this._inputField = oSource.getBindingInfo("value").parts[0].path.replace("/", "");
            }
            else {
                this._inputField = oSource.getBindingInfo("value").parts[0].path;
            }

            if (this._inputField === "EVERS") {
                console.log(this._inputValue)
                oData = this.getView().getModel("shipmode").getData();
                oData.forEach(item => {
                    item.VHTitle = item.DESCRIPTION;
                    item.VHDesc = item.SHIPMODE;
                    item.VHSelected = (item.DESCRIPTION + " (" + item.SHIPMODE +  ")" === this._inputValue);
                })
                sTitle = "Ship Mode";
                
                oData.sort((a,b) => (a.VHDesc > b.VHDesc ? 1 : -1));
            }
            else {
                if (this._inputField === "ISSPLNT") {
                    oData = this.getView().getModel("issplant").getData();
                    oData.forEach(item => {
                        item.VHTitle = item.PLANTCD;
                        item.VHSelected = (item.PLANTCD === this._inputValue);
                    })
                    sTitle = "Plant";
                }
                else if (this._inputField === "SOLDTOCUST") {
                    oData = this.getView().getModel("soldtocust").getData();
                    oData.forEach(item => {
                        item.VHTitle = item.CUSTOMER;
                        item.VHDesc = item.NAME1;
                        item.VHSelected = (item.CUSTOMER === this._inputValue);
                    })
                    sTitle = "Sold-To Customer";
                }
                else if (this._inputField === "BILLTOCUST") {
                    oData = this.getView().getModel("shiptocust").getData();
                    oData.forEach(item => {
                        item.VHTitle = item.CUSTOMER;
                        item.VHSelected = (item.CUSTOMER === this._inputValue);
                    })
                    sTitle = "Bill-To Customer";
                }            
                else if (this._inputField === "SALESTERM") {
                    oData = this.getView().getModel("salesterm").getData();
                    oData.forEach(item => {
                        item.VHTitle = item.SALESTERM;
                        item.VHDesc = item.DESCRIPTION;
                        item.VHSelected = (item.SALESTERM === this._inputValue);
                    })
                    sTitle = "Sales Term";
                }
                // else if (this._inputField === "EVERS") {
                //     console.log(this.getView().getModel("shipmode"))
                //     oData = this.getView().getModel("shipmode").getData();
                //     oData.forEach(item => {
                //         item.VHTitle = item.SHIPMODE;
                //         item.VHDesc = item.DESCRIPTION;
                //         item.VHSelected = (item.SHIPMODE === this._inputValue);
                //     })
                //     sTitle = "Ship Mode";
                // }
                else if (this._inputField === "WTUOM") {
                    oData = this.getView().getModel("wtuom").getData();
                    oData.forEach(item => {
                        item.VHTitle = item.UOM;
                        item.VHDesc = item.DESCRIPTION;
                        item.VHSelected = (item.UOM === this._inputValue);
                    })
                    sTitle = "Weight UOM";
                }
                else if (this._inputField === "VOLUOM") {
                    oData = this.getView().getModel("voluom").getData();
                    oData.forEach(item => {
                        item.VHTitle = item.UOM;
                        item.VHDesc = item.DESCRIPTION;
                        item.VHSelected = (item.UOM === this._inputValue);
                    })
                    sTitle = "Volume UOM";
                }
    
                oData.sort((a,b) => (a.VHTitle > b.VHTitle ? 1 : -1));
            }
            
            var oVHModel = new JSONModel({
                items: oData,
                title: sTitle,
                table: sModel
            }); 

            console.log(oVHModel)
            // create value help dialog
            if (!this._valueHelpDialog) {
                this._valueHelpDialog = sap.ui.xmlfragment(
                    "zuishipdoc.view.fragments.valuehelp.ValueHelpDialog",
                    this
                );
                
                this._valueHelpDialog.setModel(oVHModel);
                this.getView().addDependent(this._valueHelpDialog);
            }
            else {
                this._valueHelpDialog.setModel(oVHModel);
            }                            

            this._valueHelpDialog.open();            
        },

        handleValueHelpClose: function (oEvent) {
            if (oEvent.sId === "confirm") {
                var oSelectedItem = oEvent.getParameter("selectedItem");

                if (oSelectedItem) {
                    this._inputSource.setValue(oSelectedItem.getTitle());
                    // this._inputSource.setSelectedKey(oSelectedItem.getTitle());
                    // console.log(oSelectedItem.getTitle(), oSelectedItem.getDescription())

                    if (this._inputValue !== oSelectedItem.getTitle()) {   
                        if (this._inputField === "SOLDTOCUST") {
                            this.getView().getModel("header").setProperty('/CUSTGRP', oSelectedItem.getDescription());
                        }
                        else if (this._inputField === "SALESTERM") {
                            this.getView().getModel("header").setProperty('/SALESTERMTEXT', oSelectedItem.getDescription());
                        }
                        else if (this._inputField === "EVERS") {
                            this._inputSource.setSelectedKey(oSelectedItem.getDescription());
                        }

                        this._bHeaderChanged = true;
                        if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(true); }
                    }
                }

                this._inputSource.setValueState("None");
            }
            else if (oEvent.sId === "cancel") {

            }
        },

        onFormValueHelpInputChange: async function(oEvent) {
            // console.log("dumaan dito");
            var oSource = oEvent.getSource();
            var isInvalid = !oSource.getSelectedKey() && oSource.getValue().trim();
            oSource.setValueState(isInvalid ? "Error" : "None");

            // oSource.getSuggestionItems().forEach(item => {
            //     if (item.getProperty("key") === oSource.getValue().trim()) {
            //         isInvalid = false;
            //         oSource.setValueState(isInvalid ? "Error" : "None");
            //     }
            // }) 

            if (isInvalid) this._validationErrors.push(oEvent.getSource().getId());
            else {
                var sModel = oSource.getBindingInfo("value").parts[0].model;
                var sPath = oSource.getBindingInfo("value").parts[0].path;

                this.getView().getModel(sModel).setProperty(sPath, oSource.getSelectedKey());
                // console.log(this.getView().getModel(sModel).getData())
                if (sPath === "/SOLDTOCUST") {
                    var oSoldToCust = this.getView().getModel("soldtocust").getData().filter(fItem => fItem.CUSTOMER === oSource.getSelectedKey());

                    if (this.getView().getModel(sModel).getProperty("/CUSTGRP") !== oSoldToCust[0].CUSTGRP) {
                        this.getView().getModel(sModel).setProperty("/CUSTGRP", oSoldToCust[0].CUSTGRP);
                        this.byId("fldCUSTGRP").setSelectedKey(oSoldToCust[0].CUSTGRP);
                        this.getView().getModel(sModel).setProperty("/CONSIGN", "");
                        this.getView().getModel(sModel).setProperty("/MESSRS", "");

                        this._oModel.read("/ConsignSHSet", {
                            urlParameters: {
                                "$filter": "CUSTGRP eq '" + oSoldToCust[0].CUSTGRP + "'"
                            },
                            success: function (oData, oResponse) {
                                me.getView().getModel("consign").setProperty("/", oData.results);
                                // me.getView().setModel(new JSONModel(oData.results), "consign");
                            },
                            error: function (err) { }
                        });
                    }
                }
                // else if (sPath === "/SALESTERM") {
                //     var oSalesTerm = this.getView().getModel("salesterm").getData().filter(fItem => fItem.SALESTERM === oSource.getSelectedKey());
                //     this.getView().getModel(sModel).setProperty("/SALESTERMTEXT", oSalesTerm[0].DESCRIPTION);
                // }

                this._validationErrors.forEach((item, index) => {
                    if (item === oEvent.getSource().getId()) {
                        this._validationErrors.splice(index, 1)
                    }
                })
            }

            // this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
            // console.log(this._validationErrors);
            this._bHeaderChanged = true;

            if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(true); }
        },

        onValueHelpInputChange: function (oEvent) {
            var oSource = oEvent.getSource();
            var sRowPath = oSource.oParent.getBindingContext().sPath;
            var isInvalid = !oSource.getSelectedKey() && oSource.getValue().trim();
            oSource.setValueState(isInvalid ? "Error" : "None");

            oSource.getSuggestionItems().forEach(item => {                    
                if (item.getProperty("key") === oSource.getSelectedKey()) {
                    isInvalid = false;
                    oSource.setValueState(isInvalid ? "Error" : "None");
                }
            })

            if (isInvalid) this._validationErrors.push(oEvent.getSource().getId());
            else {
                this.byId(this._sActiveTable).getModel().setProperty(sRowPath + '/' + oSource.getBindingInfo("value").parts[0].path, oSource.getSelectedKey());

                this._validationErrors.forEach((item, index) => {
                    if (item === oEvent.getSource().getId()) {
                        this._validationErrors.splice(index, 1)
                    }
                })
            }

            this.byId(this._sActiveTable).getModel().setProperty(sRowPath + '/EDITED', true);

            // if (this._sActiveTable === "headerTab") this._bHdrChanged = true;
            // else if (this._sActiveTable === "detailTab") this._bDtlChanged = true;
        },

        formatValueHelp2: function(sKey, sColumnId) {
            // console.log(sColumnId, sKey);
            var oValue = [];
            var sValue = "";

            if (sColumnId === "EVERS") {
                oValue = me.getView().getModel("shipmode").getData().filter(v => v.SHIPMODE === sKey);

                if (oValue.length > 0) sValue = oValue[0].DESCRIPTION;

                if (this.getView().byId("fldEVERS").getSelectedKey() !== sKey) {
                    this.getView().byId("fldEVERS").setSelectedKey(sKey);
                }
            }
            else if (sColumnId === "STATUS") {
                oValue = me.getView().getModel("status").getData().filter(v => v.DLVSTATCD === sKey);

                if (oValue.length > 0) sValue = oValue[0].SHORTEXT;
            }

            if (oValue && oValue.length > 0) {
                return sValue + " (" + sKey + ")";
            }
            else return sKey;
        },

        formatValueHelp: function(sValue, sPath, sKey, sText, sFormat) {
            // console.log(sValue, sPath, sKey, sText, sFormat);
            var oValue = this.getView().getModel(sPath).getData().filter(v => v[sKey] === sValue);;

            if (oValue && oValue.length > 0) {
                if (sFormat === "Value") {
                    return oValue[0][sText];
                }
                else if (sFormat === "ValueKey") {
                    return oValue[0][sText] + " (" + sValue + ")";
                }
                else if (sFormat === "KeyValue") {
                    return sValue + " (" + oValue[0][sText] + ")";
                }
                else {
                    return sValue
                }
            }
            else return sValue;
        },

        formatFormInput(fields) {
            fields.forEach(col => {
                if (col.DataType === "NUMBER") {
                      this.byId("fld" + col.ColumnName).bindValue({  
                        model: "header",
                        path: "/" + col.ColumnName,
                        formatOptions: {
                            minFractionDigits: col.Decimal,
                            maxFractionDigits: col.Decimal
                        },
                        constraints: {
                            precision: col.Length,
                            scale: col.Decimal
                        }
                    });
                }
                else if (col.DataType === "STRING") {
                    // console.log(col)
                    if (this.byId("fld" + col.ColumnName) !== undefined) {
                        if (this.byId("fld" + col.ColumnName).mProperties.showValueHelp !== undefined) {
                            if (!this.byId("fld" + col.ColumnName).getProperty("showValueHelp")) {
                                this.byId("fld" + col.ColumnName).setProperty("maxLength", col.Length);
                            }
                        }
                        else if (this.byId("fld" + col.ColumnName).mProperties.value !== undefined) {
                            this.byId("fld" + col.ColumnName).setProperty("maxLength", col.Length);
                        }
                    }
                }
            })
        },

        onNumberLiveChange: function(oEvent) {
            var oSource = oEvent.getSource();
            var vColDecPlaces = oSource.getBindingInfo("value").constraints.scale;
            var vColLength = oSource.getBindingInfo("value").constraints.precision;

            if (oEvent.getParameters().value.split(".")[0].length > (vColLength - vColDecPlaces)) {
                oEvent.getSource().setValueState("Error");
                oEvent.getSource().setValueStateText("Enter a number with a maximum whole number length of " + (vColLength - vColDecPlaces));

                if (this._validationErrors.filter(fItem => fItem === oEvent.getSource().getId()).length === 0) {
                    this._validationErrors.push(oEvent.getSource().getId());
                }
            }
            else if (oEvent.getParameters().value.split(".").length > 1) {
                if (vColDecPlaces === 0) {
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Enter a number without decimal place/s");
                    
                    if (this._validationErrors.filter(fItem => fItem === oEvent.getSource().getId()).length === 0) {
                        this._validationErrors.push(oEvent.getSource().getId());
                    }
                }
                else {
                    if (oEvent.getParameters().value.split(".")[1].length > vColDecPlaces) {
                        oEvent.getSource().setValueState("Error");
                        oEvent.getSource().setValueStateText("Enter a number with a maximum of " + vColDecPlaces.toString() + " decimal places");
                        
                        if (this._validationErrors.filter(fItem => fItem === oEvent.getSource().getId()).length === 0) {
                            this._validationErrors.push(oEvent.getSource().getId());
                        }
                    }
                    else {
                        oEvent.getSource().setValueState("None");
                        this._validationErrors.forEach((item, index) => {
                            if (item === oEvent.getSource().getId()) {
                                this._validationErrors.splice(index, 1);
                            }
                        })
                    }
                }
            }
            else {
                oEvent.getSource().setValueState("None");
                this._validationErrors.forEach((item, index) => {
                    if (item === oEvent.getSource().getId()) {
                        this._validationErrors.splice(index, 1);
                    }
                })
            }

            if (oSource.getBindingInfo("value").binding && oSource.getBindingInfo("value").binding.oContext && oSource.getBindingInfo("value").binding.oContext.sPath) {
                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                this.byId(this._sActiveTable).getModel().setProperty(sRowPath + '/EDITED', true);
            }

            if (this._sActiveTable === "delvDtlTab") {
                this._bDelvDtlChanged = true;
            }
            else {
                this._bHeaderChanged = true;
            }

            if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(true); }
        },

        onInputChange: function(oEvent) {
            if (this._sActiveTable === "delvDtlTab") {
                this._bDelvDtlChanged = true;
            }
            else {
                this._bHeaderChanged = true;
            } 

            if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(true); }
        },

        onCheckBoxChange: function (oEvent) {
            this._bHeaderChanged = true;
            
            if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(true); }
        },

        setColumnFilters(sTable) {
            if (this._aColFilters) {
                var oTable = this.byId(sTable);
                var oColumns = oTable.getColumns();

                this._aColFilters.forEach(item => {
                    oColumns.filter(fItem => fItem.getFilterProperty() === item.sPath)
                        .forEach(col => {
                            col.filter(item.oValue1);
                        })
                })
            } 
        },

        setColumnSorters(sTable) {
            if (this._aColSorters) {
                var oTable = this.byId(sTable);
                var oColumns = oTable.getColumns();

                this._aColSorters.forEach(item => {
                    oColumns.filter(fItem => fItem.getSortProperty() === item.sPath)
                        .forEach(col => {
                            col.sort(item.bDescending);
                        })
                })
            } 
        },

        handleFormValueHelp: function (oEvent) {
            //open product type value help
            // console.log(TableValueHelp)
            TableValueHelp.handleFormValueHelp(oEvent, this);
        },

        lock: async (me) => {
            var oModelLock = me.getOwnerComponent().getModel("ZGW_3DERP_LOCK2_SRV");
            var oParamLock = {
                Lock_Unlock_Ind: "X",
                IV_Count: 600,
                N_DLVHDR_TAB: [{Dlvno: me.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv}],
                N_LOCK_UNLOCK_DLVHDR_RET: [],
                N_LOCK_UNLOCK_DLVHDR_MSG: []
            }

            me._oLock.push(oParamLock);
            // console.log(oParamLock)
            var promise = new Promise((resolve, reject) => {
                oModelLock.create("/Lock_Unlock_DlvHdrSet", oParamLock, {
                    method: "POST",
                    success: function(oData, oResponse) {
                        // console.log(oData);
                        // console.log(oResponse);
                        if (oData.N_LOCK_UNLOCK_DLVHDR_MSG.results[0].Type === "E"){
                            resolve(false);
                            MessageBox.information(oData.N_LOCK_UNLOCK_DLVHDR_MSG.results[0].Message);
                            // me.unLock();
                        }
                        else {
                            resolve(true);
                            me.getOwnerComponent().getModel("LOCK_MODEL").setProperty("/item", me._oLock);
                        }
                    },
                    error: function(err) {
                        MessageBox.error(err);
                        me.unLock();
                        resolve(false);
                    }
                });
            })

            return await promise;
        },
        
        unLock() {
            if (this._oLock.length === 0) { return; }

            var me = this;
            var oModelLock = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZGW_3DERP_LOCK2_SRV/");
            var oParamLock = this._oLock[0];

            oParamLock["Lock_Unlock_Ind"] = "";
            console.log("unlock", oParamLock);

            oModelLock.create("/Lock_Unlock_DlvHdrSet", oParamLock, {
                method: "POST",
                success: function(oData, oResponse) {
                    me._oLock = [];

                    if (me.getOwnerComponent() !== undefined) {
                        me.getOwnerComponent().getModel("LOCK_MODEL").setProperty("/item", me._oLock);
                    }
                },
                error: function(err) {
                    // MessageBox.error(err);
                    // Common.closeProcessingDialog(me);
                }
            });                 
        },

        asyncUnLock: async (me) => {
            if (me._oLock.length === 0) { return; }

            var oModelLock = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZGW_3DERP_LOCK2_SRV/");
            var oParamLock = me._oLock[0];

            oParamLock["Lock_Unlock_Ind"] = "";
            console.log(oParamLock);

            var promise = new Promise((resolve, reject) => {
                oModelLock.create("/Lock_Unlock_DlvHdrSet", oParamLock, {
                    method: "POST",
                    success: function(oData, oResponse) {   
                        me._oLock = [];

                        if (me.getOwnerComponent() !== undefined) {
                            me.getOwnerComponent().getModel("LOCK_MODEL").setProperty("/item", me._oLock);
                        }

                        resolve(true);
                    },
                    error: function(err) {
                        // MessageBox.error(err);
                        resolve(false);
                    }
                });
            })

            return await promise;
        },
        
        onCellClick: function (oEvent) {
            if (oEvent.getParameters().rowBindingContext) {
                var oTable = oEvent.getSource(); //this.byId("ioMatListTab");
                var sRowPath = oEvent.getParameters().rowBindingContext.sPath;

                this._sActiveTable = oTable.getId().split("--")[oControl.sId.split("--").length - 1];
                console.log(this._sActiveTable)

                oTable.getModel().getData().rows.forEach(row => row.ACTIVE = "");
                oTable.getModel().setProperty(sRowPath + "/ACTIVE", "X");

                oTable.getRows().forEach(row => {
                    if (row.getBindingContext() && row.getBindingContext().sPath.replace("/rows/", "") === sRowPath.replace("/rows/", "")) {
                        row.addStyleClass("activeRow");
                    }
                    else row.removeStyleClass("activeRow")
                })
            }
        },

        onTableClick(oEvent) {
            var oControl = oEvent.srcControl;
            var sTabId = oControl.sId.split("--")[oControl.sId.split("--").length - 1];

            while (sTabId.substr(sTabId.length - 3) !== "Tab") {                    
                oControl = oControl.oParent;
                sTabId = oControl.sId.split("--")[oControl.sId.split("--").length - 1];
            }
            
            if (this._dataMode === "READ") this._sActiveTable = sTabId;
        },

        onAfterTableRendering: function (oEvent) {
            if (this._tableRendered !== "") {
                this.setActiveRowHighlightByTableId(this._tableRendered);
                this._tableRendered = "";
            }
        },

        onFirstVisibleRowChanged: function (oEvent) {
            var oTable = oEvent.getSource();
            var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
            this._sActiveTable = sTabId;

            setTimeout(() => {
                var oData = oTable.getModel().getData().rows;
                var iStartIndex = oTable.getBinding("rows").iLastStartIndex;
                var iLength = oTable.getBinding("rows").iLastLength + iStartIndex;

                if (oTable.getBinding("rows").aIndices.length > 0) {
                    for (var i = iStartIndex; i < iLength; i++) {
                        var iDataIndex = oTable.getBinding("rows").aIndices.filter((fItem, fIndex) => fIndex === i);

                        if (oData[iDataIndex].ACTIVE === "X") oTable.getRows()[iStartIndex === 0 ? i : i - iStartIndex].addStyleClass("activeRow");
                        else oTable.getRows()[iStartIndex === 0 ? i : i - iStartIndex].removeStyleClass("activeRow");
                    }
                }
                else {
                    for (var i = iStartIndex; i < iLength; i++) {
                        if (oData[i].ACTIVE === "X") oTable.getRows()[iStartIndex === 0 ? i : i - iStartIndex].addStyleClass("activeRow");
                        else oTable.getRows()[iStartIndex === 0 ? i : i - iStartIndex].removeStyleClass("activeRow");
                    }
                }
            }, 1);
        },

        onColumnUpdated: function (oEvent) {
            var oTable = oEvent.getSource();
            var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
            this._sActiveTable = sTabId;

            this.setActiveRowHighlightByTableId(sTabId);
        },

        onSort: function(oEvent) {
            var oTable = oEvent.getSource();
            var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
            this._sActiveTable = sTabId;

            this.setActiveRowHighlightByTableId(sTabId);
        },

        onKeyUp(oEvent) {
            if ((oEvent.key === "ArrowUp" || oEvent.key === "ArrowDown") && oEvent.srcControl.sParentAggregationName === "rows") {
                var oTable = this.byId(oEvent.srcControl.sId).oParent;

                if (this.byId(oEvent.srcControl.sId).getBindingContext()) {
                    var sRowPath = this.byId(oEvent.srcControl.sId).getBindingContext().sPath;

                    oTable.getModel().getData().rows.forEach(row => row.ACTIVE = "");
                    oTable.getModel().setProperty(sRowPath + "/ACTIVE", "X");

                    oTable.getRows().forEach(row => {
                        if (row.getBindingContext() && row.getBindingContext().sPath.replace("/rows/", "") === sRowPath.replace("/rows/", "")) {
                            row.addStyleClass("activeRow");
                        }
                        else row.removeStyleClass("activeRow")
                    })
                }

                if (oTable.getId().indexOf("headerTab") >= 0) {
                    var oTableDetail = this.byId("detailTab");
                    var oColumns = oTableDetail.getColumns();

                    for (var i = 0, l = oColumns.length; i < l; i++) {
                        if (oColumns[i].getSorted()) {
                            oColumns[i].setSorted(false);
                        }
                    }
                }
            }
            else if (oEvent.key === "Enter" && oEvent.srcControl.sParentAggregationName === "cells") {
                if (this._dataMode === "NEW") this.onAddNewRow();
            }               
        },
        
        onInputKeyDown(oEvent) {
            if (oEvent.key === "ArrowUp" || oEvent.key === "ArrowDown") {
                //prevent increase/decrease of number value
                oEvent.preventDefault();
                
                var sTableId = oEvent.srcControl.oParent.oParent.sId;
                var oTable = this.byId(sTableId);
                var sColumnName = oEvent.srcControl.getBindingInfo("value").parts[0].path;
                var sCurrentRowIndex = +oEvent.srcControl.oParent.getBindingContext().sPath.replace("/rows/", "");
                var sColumnIndex = -1;
                var sCurrentRow = -1;
                var sNextRow = -1;
                var sActiveRow = -1;
                var iFirstVisibleRowIndex = oTable.getFirstVisibleRow();
                var iVisibleRowCount = oTable.getVisibleRowCount();

                oTable.getModel().setProperty(oEvent.srcControl.oParent.getBindingContext().sPath + "/" + oEvent.srcControl.getBindingInfo("value").parts[0].path, oEvent.srcControl.getValue());

                //get active row (arrow down)
                oTable.getBinding("rows").aIndices.forEach((item, index) => {
                    if (item === sCurrentRowIndex) { sCurrentRow = index; }
                    if (sCurrentRow !== -1 && sActiveRow === -1) { 
                        if ((sCurrentRow + 1) === index) { sActiveRow = item }
                        else if ((index + 1) === oTable.getBinding("rows").aIndices.length) { sActiveRow = item }
                    }
                })
                
                //clear active row
                oTable.getModel().getData().rows.forEach(row => row.ACTIVE = "");

                //get next row to focus and active row (arrow up)
                if (oEvent.key === "ArrowUp") { 
                    if (sCurrentRow !== 0) {
                        sActiveRow = oTable.getBinding("rows").aIndices.filter((fItem, fIndex) => fIndex === (sCurrentRow - 1))[0];
                    }
                    else { sActiveRow = oTable.getBinding("rows").aIndices[0] }

                    sCurrentRow = sCurrentRow === 0 ? sCurrentRow : sCurrentRow - iFirstVisibleRowIndex;
                    sNextRow = sCurrentRow === 0 ? 0 : sCurrentRow - 1;
                }
                else if (oEvent.key === "ArrowDown") { 
                    sCurrentRow = sCurrentRow - iFirstVisibleRowIndex;
                    sNextRow = sCurrentRow + 1;
                }

                //set active row
                oTable.getModel().setProperty("/rows/" + sActiveRow + "/ACTIVE", "X");

                //auto-scroll up/down
                if (oEvent.key === "ArrowDown" && (sNextRow + 1) < oTable.getModel().getData().rows.length && (sNextRow + 1) > iVisibleRowCount) {
                    oTable.setFirstVisibleRow(iFirstVisibleRowIndex + 1);
                }   
                else if (oEvent.key === "ArrowUp" && sCurrentRow === 0 && sNextRow === 0 && iFirstVisibleRowIndex !== 0) { 
                    oTable.setFirstVisibleRow(iFirstVisibleRowIndex - 1);
                }

                //get the cell to focus
                oTable.getRows()[sCurrentRow].getCells().forEach((cell, index) => {
                    if (cell.getBindingInfo("value") !== undefined) {
                        if (cell.getBindingInfo("value").parts[0].path === sColumnName) { sColumnIndex = index; }
                    }
                })
                
                if (oEvent.key === "ArrowDown") {
                    sNextRow = sNextRow === iVisibleRowCount ? sNextRow - 1 : sNextRow;
                }

                //set focus on cell
                setTimeout(() => {
                    oTable.getRows()[sNextRow].getCells()[sColumnIndex].focus();
                    oTable.getRows()[sNextRow].getCells()[sColumnIndex].getFocusDomRef().select();
                }, 100);

                //set row highlight
                this.setActiveRowHighlight();
            }
        },
        
        onFormInputKeyDown(oEvent) {
            oEvent.preventDefault();
        },

        setActiveRowHighlight(sTableId) {
            var oTable = this.byId(sTableId !== undefined && sTableId !== "" ? sTableId : this._sActiveTable);

            setTimeout(() => {
                var iActiveRowIndex = oTable.getModel().getData().rows.findIndex(item => item.ACTIVE === "X");

                oTable.getRows().forEach(row => {
                    if (row.getBindingContext() && +row.getBindingContext().sPath.replace("/rows/", "") === iActiveRowIndex) {
                        row.addStyleClass("activeRow");
                    }
                    else row.removeStyleClass("activeRow");
                })                    
            }, 100);
        },

        setActiveRowHighlightByTableId(arg) {
            var oTable = this.byId(arg);

            setTimeout(() => {
                var iActiveRowIndex = oTable.getModel().getData().rows.findIndex(item => item.ACTIVE === "X");

                oTable.getRows().forEach(row => {
                    if (row.getBindingContext() && +row.getBindingContext().sPath.replace("/rows/", "") === iActiveRowIndex) {
                        row.addStyleClass("activeRow");
                    }
                    else row.removeStyleClass("activeRow");
                })
            }, 10);
        },

        formatTimeOffSet(pTime) {
            let TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
            return timeFormat.format(new Date(pTime + TZOffsetMs));
        },

        onWrapText: function(oEvent) {
            this._sActiveTable = oEvent.getSource().data("TableId");
            var vWrap = this.getView().getModel("ui").getData().dataWrap[this._sActiveTable];
            
            this.byId(this._sActiveTable).getColumns().forEach(col => {
                var oTemplate = col.getTemplate();
                oTemplate.setWrapping(!vWrap);
                col.setTemplate(oTemplate);
            })

            this.getView().getModel("ui").setProperty("/dataWrap/" + [this._sActiveTable], !vWrap);
        },

        onSaveTableLayout: function (oEvent) {
            //saving of the layout of table
            this._sActiveTable = oEvent.getSource().data("TableId");
            var oTable = this.byId(this._sActiveTable);
            var oColumns = oTable.getColumns();
            var vSBU = this.getOwnerComponent().getModel("UI_MODEL").getData().sbu; 
            var me = this;
            var ctr = 1;

            var oParam = {
                "SBU": vSBU,
                "TYPE": this._oTableLayout[this._sActiveTable].type,
                "TABNAME": this._oTableLayout[this._sActiveTable].tabname,
                "TableLayoutToItems": []
            };

            //get information of columns, add to payload
            oColumns.forEach((column) => {
                oParam.TableLayoutToItems.push({
                    // COLUMNNAME: column.sId,
                    COLUMNNAME: column.mProperties.sortProperty,
                    ORDER: ctr.toString(),
                    SORTED: column.mProperties.sorted,
                    SORTORDER: column.mProperties.sortOrder,
                    SORTSEQ: "1",
                    VISIBLE: column.mProperties.visible,
                    WIDTH: column.mProperties.width.replace('px',''),
                    WRAPTEXT: this.getView().getModel("ui").getData().dataWrap[this._sActiveTable] === true ? "X" : ""
                });

                ctr++;
            });

            //call the layout save
            var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");

            oModel.create("/TableLayoutSet", oParam, {
                method: "POST",
                success: function(data, oResponse) {
                    MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_LAYOUT_SAVE"]);
                },
                error: function(err) {
                    MessageBox.error(err);
                }
            });                
        },

        //******************************************* */
        // Column Filtering
        //******************************************* */

        onColFilterClear: function(oEvent) {
            TableFilter.onColFilterClear(oEvent, this);
        },

        onColFilterCancel: function(oEvent) {
            TableFilter.onColFilterCancel(oEvent, this);
        },

        onColFilterConfirm: function(oEvent) {
            TableFilter.onColFilterConfirm(oEvent, this);
        },

        onFilterItemPress: function(oEvent) {
            TableFilter.onFilterItemPress(oEvent, this);
        },

        onFilterValuesSelectionChange: function(oEvent) {
            TableFilter.onFilterValuesSelectionChange(oEvent, this);
        },

        onSearchFilterValue: function(oEvent) {
            TableFilter.onSearchFilterValue(oEvent, this);
        },

        onCustomColFilterChange: function(oEvent) {
            TableFilter.onCustomColFilterChange(oEvent, this);
        },

        onSetUseColFilter: function(oEvent) {
            TableFilter.onSetUseColFilter(oEvent, this);
        },

        onRemoveColFilter: function(oEvent) {
            TableFilter.onRemoveColFilter(oEvent, this);
        },

    })
})