sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast",
    "../js/Common",
],

function (Controller, JSONModel, MessageBox, History, MessageToast,Common) {

    var me;
    var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "MM/dd/yyyy" });
    var sapDateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "yyyy-MM-dd" });
    
    return Controller.extend("zuishipdoc.controller.Detail", {

        onInit: function() {
            me = this;
            this._oModel = this.getOwnerComponent().getModel();
            this._oModelCommon = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");               

            const route = this.getOwnerComponent().getRouter().getRoute("RouteDetail");
            route.attachPatternMatched(this.onPatternMatched, this);
        },
        
        onPatternMatched: function() {
            me = this;
            this._oModel = this.getOwnerComponent().getModel();
            this._oModelCommon = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");            
            this._aColumns = [];
            this._aDataBeforeChange = [];
            this._oDataBeforeChange = {};
            this._sActiveTable = "";
            this._validationErrors = [];
            this._dataMode = this.getOwnerComponent().getModel("UI_MODEL").getData().action;
            // this.getView().setModel(new JSONModel(this._oBlankHeaderData), "header");
            
            //set initial list of ship mode and status
            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("SHIPMODE_MODEL").getData().rows), "shipmode");
            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("STATUS_MODEL").getData().rows), "status");
            
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
                    me.getView().setModel(new JSONModel(oData.results), "issplant");
                },
                error: function (err) { }
            });

            this._oModel.read("/ShipToCustSHSet", {
                success: function (oData, oResponse) {
                    me.getView().setModel(new JSONModel(oData.results), "shiptocust");
                },
                error: function (err) { }
            });

            this._oModel.read("/SalesTermSHSet", {
                success: function (oData, oResponse) {
                    me.getView().setModel(new JSONModel(oData.results), "salesterm");
                },
                error: function (err) { }
            });

            this._oModel.read("/WtUOMSHSet", {
                success: function (oData, oResponse) {
                    me.getView().setModel(new JSONModel(oData.results), "wtuom");
                },
                error: function (err) { }
            });

            this._oModel.read("/VolUOMSHSet", {
                success: function (oData, oResponse) {
                    me.getView().setModel(new JSONModel(oData.results), "voluom");
                },
                error: function (err) { }
            });

            // this.getColumnProp();
            this.getDynamicColumns("SHPDOCDLVSCHD", "Z3DERP_SHPDCDLVS", "delvSchedTab");

            setTimeout(() => {
                me.getDynamicColumns("SHPDOCDLVDTLS", "Z3DERP_SHPDCDLVD", "delvDtlTab");
            }, 100);

            setTimeout(() => {
                me.getDynamicColumns("SHPDOCDLVSTAT", "ZERP_DLVSTAT", "delvStatTab");
            }, 100);

            // if (sap.ui.getCore().byId("backBtn") !== undefined) {
            //     sap.ui.getCore().byId("backBtn").mEventRegistry.press[0].fFunction = function(oEvent) {
            //         me.onNavBack();
            //     }
            // }

            // var vSBU = this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv;
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

            this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("CAPTION_MSGS_MODEL").getData().text), "ddtext");
            this.byId("itbDetail").setSelectedKey("delvsched");           

            if (this._dataMode === "NEW" || this._dataMode === "EDIT") {
                this.setHeaderFieldsEditable(true);                

                if (this.getOwnerComponent().getModel("UI_MODEL").getData().action === "NEW") {
                    oHeaderData = {
                        DLVNO: "",
                        ISSPLNT: "",
                        SOLDTOCUST: "",
                        BILLTOCUST: "",
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
                        STATUS: "00",
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
                this.getView().byId("btnSaveHdr").setVisible(true);
                this.getView().byId("btnCancelHdr").setVisible(true);

                this.getView().byId("btnEditShipDtl").setEnabled(false);            

                var oIconTabBar = this.byId("itbDetail");
                oIconTabBar.getItems().forEach(item => item.setProperty("enabled", false));

                if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(true); }
            }
            else if (this._dataMode === "READ") {
                this.getView().byId("btnEditHdr").setEnabled(true);
                this.getView().byId("btnEditHdr").setVisible(true);
                this.getView().byId("btnSaveHdr").setVisible(false);
                this.getView().byId("btnCancelHdr").setVisible(false);
    
                this.getView().byId("btnEditShipDtl").setEnabled(true);
                this.getView().byId("btnEditShipDtl").setVisible(true);
                this.getView().byId("btnAddDelvSched").setEnabled(true);
                this.getView().byId("btnAddDelvSched").setVisible(true);
                this.getView().byId("btnDeleteDelvSched").setEnabled(true);
                this.getView().byId("btnDeleteDelvSched").setVisible(true);
                this.getView().byId("btnCompleteDelvSched").setEnabled(true);
                this.getView().byId("btnCompleteDelvSched").setVisible(true);
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
                this.getDelvStatusData(); 

                this.byId("delvSchedTab").getModel().setProperty("/rows", oDelvSchedData);
                this.byId("delvSchedTab").bindRows("/rows");
            }
            
            this.getView().setModel(new JSONModel(oHeaderData), "header");
            this._oDataBeforeChange = jQuery.extend(true, {}, oHeaderData);
        },

        onNavBack: function(oEvent) {
            console.log("navback");

            // var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            // oRouter.navTo("RouteMain", {}, true /*no history*/);

            // this.setRowReadMode("header");
            // this.setRowReadMode("detail");            
        },

        getColumnProp: async function() {
            var sPath = jQuery.sap.getModulePath("zuiaprocess", "/model/columns.json");

            var oModelColumns = new JSONModel();
            await oModelColumns.loadData(sPath);

            this._aColumns = oModelColumns.getData();
            this.setRowEditMode("detail");
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

                if (sColumnWidth === 0) sColumnWidth = 100;

                return new sap.ui.table.Column({
                    id: sTabId.replace("Tab", "") + "Col" + sColumnId,
                    label: new sap.m.Text({text: sColumnLabel}),
                    template: new sap.m.Text({ 
                        text: "{" + sColumnId + "}", 
                        wrapping: false,
                        tooltip: sColumnDataType === "BOOLEAN" ? "" : "{" + sColumnId + "}"
                    }),
                    width: sColumnWidth + 'px',
                    sortProperty: sColumnId,
                    filterProperty: sColumnId,
                    autoResizable: true,
                    visible: sColumnVisible,
                    sorted: sColumnSorted,                        
                    hAlign: sColumnDataType === "NUMBER" ? "End" : sColumnDataType === "BOOLEAN" ? "Center" : "Begin",
                    sortOrder: ((sColumnSorted === true) ? sColumnSortOrder : "Ascending" ),
                });
            });
        },

        getDelvDetailData() {
            // console.log(this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv)
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
                        });
                    }

                    me.byId("delvDtlTab").getModel().setProperty("/rows", oData.results);
                    me.byId("delvDtlTab").bindRows("/rows");
                },
                error: function (err) { 
                    Common.closeProcessingDialog(me);
                }
            })
        },

        getDelvStatusData() {
            this._oModel.read('/StatusSet', {
                urlParameters: {
                    "$filter": "DLVNO eq '" + this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv + "'"
                },
                success: function (oData) {
                    if (oData.results.length > 0) {
                        // oData.results.sort((a,b) => (a.DLVITEM > b.DLVITEM ? 1 : -1));

                        oData.results.forEach((item, index) => {  
                            if (!(item.UPDATEDDT === null || item.UPDATEDDT === ""))
                            { item.UPDATEDDT = dateFormat.format(new Date(item.UPDATEDDT)); }

                            if (index === 0) { item.ACTIVE = "X"; }
                            else { item.ACTIVE = ""; }
                        });
                    }
                    // console.log(oData.results)
                    me.byId("delvStatTab").getModel().setProperty("/rows", oData.results);
                    me.byId("delvStatTab").bindRows("/rows");
                },
                error: function (err) { 
                    Common.closeProcessingDialog(me);
                }
            })
        },

        onCreate: function (oEvent) {
            var oTable = oEvent.getSource().oParent.oParent;
            this._aDataBeforeChange = jQuery.extend(true, [], oTable.getModel().getData().rows);

            if (oTable.getId().indexOf("delvSchedTab") >= 0) {
                //get fragment data
                Common.openProcessingDialog(me, "Processing...");

                this._sActiveTable = "delvSchedTab";
                this.byId("delvSchedTab").getModel().setProperty("/rows", []);
                this.byId("delvSchedTab").bindRows("/rows");

                this._oModel.setHeaders({
                    plant: this.getView().byId("delvHdrISSPLNT").getValue(),
                    custcd: this.getView().byId("delvHdrSOLDTOCUST").getValue()
                })

                this._oModel.read('/IODelvSet', {
                    success: function (oData) {                           
                        Common.closeProcessingDialog(me);
                        
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
                                    rowCount: oData.results.length > 13 ? oData.results.length : 13
                                })
                            )
        
                            me.getView().addDependent(me._AddDelvSchedDialog);
        
                            // var oTableEventDelegate = {
                            //     onkeyup: function (oEvent) {
                            //         me.onKeyUp(oEvent);
                            //     },
        
                            //     onAfterRendering: function (oEvent) {
                            //         var oControl = oEvent.srcControl;
                            //         var sTabId = oControl.sId.split("--")[oControl.sId.split("--").length - 1];
        
                            //         if (sTabId.substr(sTabId.length - 3) === "Tab") me._tableRendered = sTabId;
                            //         else me._tableRendered = "";
        
                            //         me.onAfterTableRendering();
                            //     }
                            // };
        
                            // sap.ui.getCore().byId("reorderTab").addEventDelegate(oTableEventDelegate);
                        }
                        else {
                            me._AddDelvSchedDialog.getModel().setProperty("/rows", oData.results);
                            me._AddDelvSchedDialog.getModel().setProperty("/rowCount", oData.results.length > 13 ? oData.results.length : 13);
                        }
        
                        me._AddDelvSchedDialog.getContent()[0].removeSelectionInterval(0, oData.results.length - 1);

                        //open fragment
                        me._AddDelvSchedDialog.open();
                    },
                    error: function (err) {
                        Common.closeProcessingDialog(me);
                    }
                })

                this.getView().byId("btnAddDelvSched").setVisible(false);
                this.getView().byId("btnDeleteDelvSched").setVisible(false);
                this.getView().byId("btnCompleteDelvSched").setVisible(false);
                this.getView().byId("btnRefreshDelvSched").setVisible(false);
                this.getView().byId("btnAddNewDelvSched").setVisible(true);
                this.getView().byId("btnRemoveNewDelvSched").setVisible(true);
                this.getView().byId("btnSavedDelvSched").setVisible(true);
                this.getView().byId("btnCancelDelvSched").setVisible(true);

                this.getView().byId("btnEditHdr").setEnabled(false);

                var oIconTabBar = this.byId("itbDetail");
                oIconTabBar.getItems().filter(item => item.getProperty("key") !== oIconTabBar.getSelectedKey())
                    .forEach(item => item.setProperty("enabled", false));  
            }

            // this._dataMode = "NEW";
            if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(true); }
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
            var obj = oEvent.getSource().oParent.oParent;
            
            if (obj.getId().indexOf("delvHdrForm") >= 0) {
                this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("header").getData());
                this.setHeaderFieldsEditable(true);

                this.getView().byId("btnEditHdr").setVisible(false);
                this.getView().byId("btnSaveHdr").setVisible(true);
                this.getView().byId("btnCancelHdr").setVisible(true);

                this.getView().byId("btnEditShipDtl").setEnabled(false);
                this.getView().byId("btnAddDelvSched").setEnabled(false);
                this.getView().byId("btnDeleteDelvSched").setEnabled(false);
                this.getView().byId("btnCompleteDelvSched").setEnabled(false);
                this.getView().byId("btnRefreshDelvSched").setEnabled(false);                

                var oIconTabBar = this.byId("itbDetail");
                oIconTabBar.getItems().forEach(item => item.setProperty("enabled", false));

                // this.byId("delvSchedTab").setShowOverlay(true);
                // this.byId("delvStatTab").setShowOverlay(true);  
            }
            else if (obj.getId().indexOf("shipDtlForm") >= 0) {
                this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("header").getData());
                this.setShipDetailFieldsEditable(true);

                this.getView().byId("btnEditShipDtl").setVisible(false);
                this.getView().byId("btnSaveShipDtl").setVisible(true);
                this.getView().byId("btnCancelShipDtl").setVisible(true);

                this.getView().byId("btnEditHdr").setEnabled(false);

                var oIconTabBar = this.byId("itbDetail");
                oIconTabBar.getItems().filter(item => item.getProperty("key") !== oIconTabBar.getSelectedKey())
                    .forEach(item => item.setProperty("enabled", false));                
            }

            this._validationErrors = [];
            this._dataMode = "EDIT";

            if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(true); }
        },

        onCancel: function(oEvent) {
            var obj = oEvent.getSource().oParent.oParent;
            var oData = {};

            if (obj.getId().indexOf("delvHdrForm") >= 0) {
                oData = {
                    Process: "header-cancel",
                    Text: this.getView().getModel("ddtext").getData()["CONFIRM_DISREGARD_CHANGE"]
                }

                // this.setHeaderFieldsEditable(false);

                // this.getView().byId("btnEditHdr").setVisible(true);
                // this.getView().byId("btnSaveHdr").setVisible(false);
                // this.getView().byId("btnCancelHdr").setVisible(false);

                // this.getView().byId("btnEditShipDtl").setEnabled(true);
                // this.getView().byId("btnAddDelvSched").setEnabled(true);
                // this.getView().byId("btnDeleteDelvSched").setEnabled(true);
                // this.getView().byId("btnCompleteDelvSched").setEnabled(true);
                // this.getView().byId("btnRefreshDelvSched").setEnabled(true);
            }
            else if (obj.getId().indexOf("shipDtlForm") >= 0) {
                oData = {
                    Process: "shipdtl-cancel",
                    Text: this.getView().getModel("ddtext").getData()["CONFIRM_DISREGARD_CHANGE"]
                }

                // this.setShipDetailFieldsEditable(false);

                // this.getView().byId("btnEditShipDtl").setVisible(true);
                // this.getView().byId("btnSaveShipDtl").setVisible(false);
                // this.getView().byId("btnCancelShipDtl").setVisible(false);

                // this.getView().byId("btnEditHdr").setEnabled(true);
            }
            else if (obj.getId().indexOf("delvSchedTab") >= 0) {
                oData = {
                    Process: "delvsched-cancel",
                    Text: this.getView().getModel("ddtext").getData()["CONFIRM_DISREGARD_CHANGE"]
                }

                // var oTable = obj;

                // this.getView().byId("btnAddDelvSched").setVisible(true);
                // this.getView().byId("btnDeleteDelvSched").setVisible(true);
                // this.getView().byId("btnCompleteDelvSched").setVisible(true);
                // this.getView().byId("btnRefreshDelvSched").setVisible(true);
                // this.getView().byId("btnAddNewDelvSched").setVisible(false);
                // this.getView().byId("btnRemoveNewDelvSched").setVisible(false);
                // this.getView().byId("btnSavedDelvSched").setVisible(false);
                // this.getView().byId("btnCancelDelvSched").setVisible(false);

                // this.getView().byId("btnEditHdr").setEnabled(true);
                // oTable.getModel().setProperty("/rows", this._aDataBeforeChange);
                // oTable.bindRows("/rows");
            }

            if (!this._ConfirmDialog) {
                this._ConfirmDialog = sap.ui.xmlfragment("zuishipdoc.view.fragments.dialog.ConfirmDialog", this);

                this._ConfirmDialog.setModel(new JSONModel(oData));
                this.getView().addDependent(this._ConfirmDialog);
            }
            else this._ConfirmDialog.setModel(new JSONModel(oData));
                
            this._ConfirmDialog.open();

            // var oIconTabBar = me.byId("itbDetail");
            // oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));

            // if (obj.getId().indexOf("delvHdrForm") >= 0 && this._dataMode === "NEW") {
            //     var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            //     oRouter.navTo("RouteMain", {}, true);
            // }

            // this._dataMode = "READ";
        },

        onSave: function(oEvent) {
            var obj = oEvent.getSource().oParent.oParent;
            var oParam = {};
            Common.openProcessingDialog(this);
            console.log(this.getView().byId("delvHdrEVERS").getValue());
            console.log(this.getView().byId("delvHdrEVERS"));
            console.log(this.getView().byId("delvHdrEVERS").getSelectedKey());
            console.log(this.getView().byId("delvHdrEVERS").getSelectedItem());
            
            if (obj.getId().indexOf("delvHdrForm") >= 0) {
                if (this._validationErrors.length > 0) {
                    Common.closeProcessingDialog(this);
                    MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_CHECK_INVALID_ENTRIES"]);
                }
                else if (this.getView().byId("delvHdrISSPLNT").getValue() === "" ||
                    this.getView().byId("delvHdrSOLDTOCUST").getValue() === "" ||
                    this.getView().byId("delvHdrBILLTOCUST").getValue() === "" ||
                    this.getView().byId("delvHdrCUSTGRP").getValue() === "" ||
                    this.getView().byId("delvHdrSALESTERM").getValue() === "" ||
                    this.getView().byId("delvHdrDOCDT").getValue() === "" ||
                    this.getView().byId("delvHdrPOSTDT").getValue() === "" ||
                    this.getView().byId("delvHdrEVERS").getValue() === ""
                ) {
                    Common.closeProcessingDialog(this);
                    MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_INPUT_REQD_FIELDS"]);
                }
                else {
                    oParam["ISSPLNT"] = this.getView().byId("delvHdrISSPLNT").getValue();
                    oParam["SOLDTOCUST"] = this.getView().byId("delvHdrSOLDTOCUST").getValue();
                    oParam["BILLTOCUST"] = this.getView().byId("delvHdrBILLTOCUST").getValue();
                    oParam["CUSTGRP"] = this.getView().byId("delvHdrCUSTGRP").getValue();
                    oParam["SALESTERM"] = this.getView().byId("delvHdrSALESTERM").getValue();
                    oParam["SALESTERMTEXT"] = this.getView().byId("delvHdrSALESTERMTEXT").getValue();
                    oParam["DOCDT"] = sapDateFormat.format(new Date(this.getView().byId("delvHdrDOCDT").getValue())) + "T00:00:00"; //"2023-01-26T00:00:00"; //
                    oParam["POSTDT"] = sapDateFormat.format(new Date(this.getView().byId("delvHdrPOSTDT").getValue())) + "T00:00:00"; 
                    oParam["EVERS"] = this.getView().byId("delvHdrEVERS").getSelectedKey();
                    oParam["DEST"] = this.getView().byId("delvHdrDEST").getValue();
                    oParam["COO"] = this.getView().byId("delvHdrCOO").getValue();
                    oParam["REFDOCNO"] = this.getView().byId("delvHdrREFDOCNO").getValue();
                    oParam["STATUS"] = this.getView().byId("delvHdrSTATUS").getValue();
                    oParam["REMARKS"] = this.getView().byId("delvHdrREMARKS").getValue();
                    
                    if (this.getView().byId("delvHdrPLANDLVDT").getValue() !== "") {
                        oParam["PLANDLVDT"] = sapDateFormat.format(new Date(this.getView().byId("delvHdrPLANDLVDT").getValue())) + "T00:00:00";
                    } 
                    else { oParam["PLANDLVDT"] = null; }
    
                    if (this.getView().byId("delvHdrINDCDT").getValue() !== "") {
                        oParam["INDCDT"] = sapDateFormat.format(new Date(this.getView().byId("delvHdrINDCDT").getValue())) + "T00:00:00";
                    }
                    else { oParam["INDCDT"] = null; }
    
                    if (this.getView().byId("delvHdrEXFTYDT").getValue() !== "") {
                        oParam["EXFTYDT"] = sapDateFormat.format(new Date(this.getView().byId("delvHdrEXFTYDT").getValue())) + "T00:00:00";
                    }
                    else { oParam["EXFTYDT"] = null; }
    
                    if (this.getView().byId("delvHdrDEPARTDT").getValue() !== "") {
                        oParam["DEPARTDT"] = sapDateFormat.format(new Date(this.getView().byId("delvHdrDEPARTDT").getValue())) + "T00:00:00";
                    }
                    else { oParam["DEPARTDT"] = null; }
    
                    if (this.getView().byId("delvHdrREFDOCDT").getValue() !== "") {
                        oParam["REFDOCDT"] = sapDateFormat.format(new Date(this.getView().byId("delvHdrREFDOCDT").getValue())) + "T00:00:00";
                    }
                    else { oParam["REFDOCDT"] = null; }
    
                    if (this.getView().byId("delvHdrTOTALNOPKG").getValue() !== "") {
                        oParam["TOTALNOPKG"] = +this.getView().byId("delvHdrTOTALNOPKG").getValue();
                    }
                    else { oParam["TOTALNOPKG"] = null; }
    
                    if (this.getView().byId("delvHdrREVNO").getValue() !== "") {
                        oParam["REVNO"] = +this.getView().byId("delvHdrREVNO").getValue();
                    }
                    else { oParam["REVNO"] = null; }
    
                    console.log(oParam)
                    if (this._dataMode === "NEW") {
                        this._oModel.create("/HeaderSet", oParam, {
                            method: "POST",
                            success: function (oData, oResponse) {
                                var oMessage = JSON.parse(oResponse.headers["sap-message"]);
                                console.log(oMessage)
    
                                if (oMessage.severity === "success") {
                                    me.getView().byId("delvHdrDLVNO").setValue(oMessage.message);
                                    me.setHeaderFieldsEditable(false);
        
                                    me.getView().byId("btnEditHdr").setVisible(true);
                                    me.getView().byId("btnSaveHdr").setVisible(false);
                                    me.getView().byId("btnCancelHdr").setVisible(false);
            
                                    me.getView().byId("btnEditShipDtl").setEnabled(true);
                              
                                    var oIconTabBar = me.byId("itbDetail");
                                    oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));
                                    
                                    if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }

                                    me._dataMode = "READ";
                                    me.getOwnerComponent().getModel("UI_MODEL").setProperty("/activeDlv", oMessage.message);
                                    me.getOwnerComponent().getModel("UI_MODEL").setProperty("/refresh", true);
                                    Common.closeProcessingDialog(me);
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
                                me.setHeaderFieldsEditable(false);
        
                                me.getView().byId("btnEditHdr").setVisible(true);
                                me.getView().byId("btnSaveHdr").setVisible(false);
                                me.getView().byId("btnCancelHdr").setVisible(false);
        
                                me.getView().byId("btnEditShipDtl").setEnabled(true);
                                me.getView().byId("btnAddDelvSched").setEnabled(true);
                                me.getView().byId("btnDeleteDelvSched").setEnabled(true);
                                me.getView().byId("btnCompleteDelvSched").setEnabled(true);
                                me.getView().byId("btnRefreshDelvSched").setEnabled(true);
                                
                                var oIconTabBar = me.byId("itbDetail");
                                oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));
    
                                if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }

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
            }
            else if (obj.getId().indexOf("shipDtlForm") >= 0) {
                this._oModel.setHeaders({ section: "SHIPDTL" });

                oParam["VESSEL"] = this.getView().byId("shipDtlVESSEL").getValue();
                oParam["VOYAGE"] = this.getView().byId("shipDtlVOYAGE").getValue();
                oParam["CARRIER"] = this.getView().byId("shipDtlCARRIER").getValue();
                oParam["FORWRDR"] = this.getView().byId("shipDtlFORWRDR").getValue();
                oParam["FORREFNO"] = this.getView().byId("shipDtlFORREFNO").getValue();
                oParam["BOOKINGNO"] = this.getView().byId("shipDtlBOOKINGNO").getValue();
                oParam["PORTLD"] = this.getView().byId("shipDtlPORTLD").getValue();
                oParam["PORTDIS"] = this.getView().byId("shipDtlPORTDIS").getValue();
                // oParam["ETD"] = this.getView().byId("shipDtlETD").getValue();
                // oParam["ETA"] = this.getView().byId("shipDtlETA").getValue();
                oParam["HBL"] = this.getView().byId("shipDtlHBL").getValue();
                // oParam["HBLDT"] = this.getView().byId("shipDtlHBLDT").getValue();
                oParam["MBL"] = this.getView().byId("shipDtlMBL").getValue();
                // oParam["MBLDT"] = this.getView().byId("shipDtlMBLDT").getValue();
                oParam["CONSIGN"] = this.getView().byId("shipDtlCONSIGN").getValue();
                oParam["MESSRS"] = this.getView().byId("shipDtlMESSRS").getValue();
                oParam["INVPRE"] = this.getView().byId("shipDtlINVPRE").getValue();
                oParam["INVNO"] = this.getView().byId("shipDtlINVNO").getValue();
                oParam["INVSUF"] = this.getView().byId("shipDtlINVSUF").getValue();
                // oParam["INVDT"] = this.getView().byId("shipDtlINVDT").getValue();
                oParam["ACCTTYP"] = this.getView().byId("shipDtlACCTTYP").getValue();
                oParam["IMPTR"] = this.getView().byId("shipDtlIMPTR").getValue();
                oParam["EXPTR"] = this.getView().byId("shipDtlEXPTR").getValue();
                oParam["FINLDEST"] = this.getView().byId("shipDtlFINLDEST").getValue();
                oParam["CONTTYP"] = this.getView().byId("shipDtlCONTTYP").getValue();
                oParam["CONTNO"] = this.getView().byId("shipDtlCONTNO").getValue();
                oParam["SEALNO"] = this.getView().byId("shipDtlSEALNO").getValue();
                oParam["GRSWT"] = this.getView().byId("shipDtlGRSWT").getValue();
                oParam["NETWT"] = this.getView().byId("shipDtlNETWT").getValue();
                oParam["WTUOM"] = this.getView().byId("shipDtlWTUOM").getValue();
                oParam["VOLUME"] = this.getView().byId("shipDtlVOLUME").getValue();
                oParam["VOLUOM"] = this.getView().byId("shipDtlVOLUOM").getValue();
                oParam["NP1"] = this.getView().byId("shipDtlNP1").getValue();
                oParam["NP2"] = this.getView().byId("shipDtlNP2").getValue();
                oParam["NP3"] = this.getView().byId("shipDtlNP3").getValue();
                oParam["NP4"] = this.getView().byId("shipDtlNP4").getValue();
                oParam["EXPLICNO"] = this.getView().byId("shipDtlEXPLICNO").getValue();
                // oParam["EXPLICDT"] = this.getView().byId("shipDtlEXPLICDT").getValue();
                oParam["INSPOL"] = this.getView().byId("shipDtlINSPOL").getValue();
                oParam["TCINVNO"] = this.getView().byId("shipDtlTCINVNO").getValue();

                if (this.getView().byId("shipDtlETD").getValue() !== "") {
                    oParam["ETD"] = sapDateFormat.format(new Date(this.getView().byId("shipDtlETD").getValue())) + "T00:00:00";
                } 
                else { oParam["ETD"] = null; }

                if (this.getView().byId("shipDtlETA").getValue() !== "") {
                    oParam["ETA"] = sapDateFormat.format(new Date(this.getView().byId("shipDtlETA").getValue())) + "T00:00:00";
                } 
                else { oParam["ETA"] = null; }

                if (this.getView().byId("shipDtlHBLDT").getValue() !== "") {
                    oParam["HBLDT"] = sapDateFormat.format(new Date(this.getView().byId("shipDtlHBLDT").getValue())) + "T00:00:00";
                } 
                else { oParam["HBLDT"] = null; }

                if (this.getView().byId("shipDtlMBLDT").getValue() !== "") {
                    oParam["MBLDT"] = sapDateFormat.format(new Date(this.getView().byId("shipDtlMBLDT").getValue())) + "T00:00:00";
                } 
                else { oParam["MBLDT"] = null; }

                if (this.getView().byId("shipDtlINVDT").getValue() !== "") {
                    oParam["INVDT"] = sapDateFormat.format(new Date(this.getView().byId("shipDtlINVDT").getValue())) + "T00:00:00";
                } 
                else { oParam["INVDT"] = null; }

                if (this.getView().byId("shipDtlEXPLICDT").getValue() !== "") {
                    oParam["EXPLICDT"] = sapDateFormat.format(new Date(this.getView().byId("shipDtlEXPLICDT").getValue())) + "T00:00:00";
                } 
                else { oParam["EXPLICDT"] = null; }

                this._oModel.update("/HeaderSet('" + this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv + "')", oParam, {
                    method: "PUT",
                    success: function (oData, oResponse) {
                        me.setShipDetailFieldsEditable(false);

                        me.getView().byId("btnEditShipDtl").setVisible(true);
                        me.getView().byId("btnSaveShipDtl").setVisible(false);
                        me.getView().byId("btnCancelShipDtl").setVisible(false);
        
                        me.getView().byId("btnEditHdr").setEnabled(true);

                        var oIconTabBar = me.byId("itbDetail");
                        oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));

                        me._dataMode = "READ";
                    },
                    error: function (oError) {
                        Common.closeProcessingDialog(me);
                    }
                });
            }
            else if (obj.getId().indexOf("delvSchedTab") >= 0) {
                var oTable = obj;

                if (oTable.getModel().getData().rows.length > 0) {
                    this._oModel.setUseBatch(true);
                    this._oModel.setDeferredGroups(["update"]);

                    var mParameters = { groupId:"update" }

                    oTable.getModel().getData().rows.forEach(item => {
                        var param = {};

                        this._aColumns[this._sActiveTable.replace("Tab","")].forEach(col => {
                            console.log(col.ColumnName);
                            console.log(item[col.ColumnName])
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

                        // param["DLVNO"] = this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv;
                        // console.log(param)
                        this._oModel.create("/DelvSchedSet", param, mParameters);
                    })
                    
                    this._oModel.submitChanges({
                        groupId: "update",
                        success: function (oData, oResponse) {
                            console.log(oResponse);
                            MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_DATA_SAVE"]);

                            me.getView().byId("btnAddDelvSched").setVisible(true);
                            me.getView().byId("btnDeleteDelvSched").setVisible(true);
                            me.getView().byId("btnCompleteDelvSched").setVisible(true);
                            me.getView().byId("btnRefreshDelvSched").setVisible(true);
                            me.getView().byId("btnAddNewDelvSched").setVisible(false);
                            me.getView().byId("btnRemoveNewDelvSched").setVisible(false);
                            me.getView().byId("btnSavedDelvSched").setVisible(false);
                            me.getView().byId("btnCancelDelvSched").setVisible(false);
            
                            me.getView().byId("btnEditHdr").setEnabled(true);
            
                            var oIconTabBar = me.byId("itbDetail");
                            oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));
            
                            me._dataMode = "READ";
                            me.getOwnerComponent().getModel("UI_MODEL").setProperty("/refresh", true);

                            me.byId("delvSchedTab").getModel().setProperty("/rows", oTable.getModel().getData().rows.concat(me._aDataBeforeChange));
                            me.byId("delvSchedTab").bindRows("/rows");

                            me.getDelvDetailData();

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
        },

        onRefresh: function (oEvent) {
            var oTable = oEvent.getSource().oParent.oParent;

            if (oTable.getId().indexOf("delvSchedTab") >= 0) {
                this.getDelvSchedData();
            }
        },
        
        onDelete: function (oEvent) {
            var oTable = oEvent.getSource().oParent.oParent;

            if (oTable.getId().indexOf("delvSchedTab") >= 0) {
                if (oTable.getModel().getData().rows.length > 0) {
                    if (this.getView().byId("delvHdrSTATUS").getValue() === "00") {
                        var aSelIndices = oTable.getSelectedIndices();
                        var oTmpSelectedIndices = [];
                        var aData = oTable.getModel().getData().rows;

                        this._addToDelvSched = this.byId("delvSchedTab").getModel().getData().rows;

                        if (aSelIndices.length > 0) {
                            Common.openProcessingDialog(this);

                            var mParameters = { groupId:"update" }

                            aSelIndices.forEach(item => {
                                oTmpSelectedIndices.push(oTable.getBinding("rows").aIndices[item])
                            })

                            aSelIndices = oTmpSelectedIndices;

                            aSelIndices.forEach((item, index) => {
                                var sEntitySet = "/DelvSchedSet(DLVNO='" + aData.at(item).DLVNO + "',IONO='" + aData.at(item).IONO + "',DLVSEQ='" + aData.at(item).DLVSEQ + "')";
                                this._oModel.delete(sEntitySet, null, mParameters);
                            })

                            this._oModel.setUseBatch(true);
                            this._oModel.setDeferredGroups(["update"]);

                            this._oModel.submitChanges({
                                groupId: "update",
                                success: function (oData, oResponse) {
                                    aSelIndices.sort((a,b) => (a < b ? 1 : -1));
                                    aSelIndices.forEach((item, index) => {
                                        var idxToRemove = aData.indexOf(aData.at(item));
                                        aData.splice(idxToRemove, 1);
                                    })

                                    me.byId("delvSchedTab").getModel().setProperty("/rows", aData);
                                    me.byId("delvSchedTab").bindRows("/rows");
                                    me.getOwnerComponent().getModel("UI_MODEL").setProperty("/refresh", true);

                                    Common.closeProcessingDialog(me);
                                    MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_DATA_DELETED"]);
                                },
                                error: function () {
                                    Common.closeProcessingDialog(me);
                                }
                            }) 
                        } 
                        else  {
                            MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_SEL_RECORD_TO_DELETE"]);
                        }
                    }
                    else {
                        MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_DLV_DELETE_NOT_ALLOW"]);
                    }
                }
                else  {
                    MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_NO_RECORD_TO_DELETE"]);
                }
            }
        },

        onAddDelvSched: function(oEvent) {
            var oTable = this._AddDelvSchedDialog.getContent()[0];
            var aSelIndices = oTable.getSelectedIndices();
            var oTmpSelectedIndices = [];
            var aData = oTable.getModel().getData().rows;

            this._addToDelvSched = this.byId("delvSchedTab").getModel().getData().rows;

            if (aData.length > 0) {
                if (aSelIndices.length > 0) {
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

                    this.byId("delvSchedTab").getModel().setProperty("/rows", this._addToDelvSched);
                    this.byId("delvSchedTab").bindRows("/rows");
                    
                    this._AddDelvSchedDialog.getModel().setProperty("/rows", this._AddDelvSchedDialog.getModel().getData().rows);
                    this._AddDelvSchedDialog.close();
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
            this._AddDelvSchedDialog.close();
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

        onComplete: function (oEvent) {
            var oTable = oEvent.getSource().oParent.oParent;

            if (oTable.getId().indexOf("delvSchedTab") >= 0) {
                var bProceed = true;
                
                if (this.getView().byId("shipDtlINVPRE").getValue() === "" ||
                    this.getView().byId("shipDtlINVNO").getValue() === "" ||
                    this.getView().byId("shipDtlINVSUF").getValue() === "" ||
                    this.getView().byId("shipDtlACCTTYP").getValue() === "") 
                {
                    MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_DLV_INVOICE_REQD"]);
                }
                else {
                    this.byId("delvDtlTab").getModel().getData().rows.forEach(item => {
                        if (item.DLVQTYBSE > item.AVAILQTY) {
                            bProceed = false;
                        }
                    })
    
                    if (bProceed) {
                        Common.openProcessingDialog(this);
                        var oParam = { STATUS: "02" };

                        this._oModel.setHeaders({ section: "STATUS" });

                        this._oModel.update("/HeaderSet('" + this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv + "')", oParam, {
                            method: "PUT",
                            success: function (oData, oResponse) {
                                me.getOwnerComponent().getModel("UI_MODEL").setProperty("/refresh", true);
                                Common.closeProcessingDialog(me);
                            },
                            error: function (oError) {
                                Common.closeProcessingDialog(me);
                            }
                        });                        
                    }
                    else {
                        MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_DLV_INSUFFICIENT_STOCK"]);
                    }
                }
            }
        },

        onTableResize: function(oEvent) {
            if (oEvent.getSource().getId().indexOf("ExitFullScreen") >= 0) {
                this.byId("delvHdrForm").setVisible(true);
                this.byId("btnFullScreenDelvSched").setVisible(true);
                this.byId("btnExitFullScreenDelvSched").setVisible(false);
            }
            else {
                this.byId("delvHdrForm").setVisible(false);
                this.byId("btnFullScreenDelvSched").setVisible(false);
                this.byId("btnExitFullScreenDelvSched").setVisible(true);
            }
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
                            if (item.CREATEDDT !== null)
                                item.CREATEDDT = dateFormat.format(new Date(item.CREATEDDT));

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = dateFormat.format(new Date(item.UPDATEDDT));

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
                    me.setActiveRowHighlightByTableId("delvSchedTab");
                    Common.closeProcessingDialog(me);
                },
                error: function (err) {
                    Common.closeProcessingDialog(me);
                }
            })
        },

        setHeaderFieldsEditable(arg) {
            this.getView().byId("delvHdrISSPLNT").setEditable(arg);
            this.getView().byId("delvHdrSOLDTOCUST").setEditable(arg);
            this.getView().byId("delvHdrBILLTOCUST").setEditable(arg);
            // this.getView().byId("delvHdrCUSTGRP").setEditable(arg);
            this.getView().byId("delvHdrSALESTERM").setEditable(arg);
            // this.getView().byId("delvHdrSALESTERMTEXT").setEditable(arg);
            this.getView().byId("delvHdrDOCDT").setEditable(arg);
            this.getView().byId("delvHdrPOSTDT").setEditable(arg);
            this.getView().byId("delvHdrPLANDLVDT").setEditable(arg);
            this.getView().byId("delvHdrINDCDT").setEditable(arg);
            this.getView().byId("delvHdrEXFTYDT").setEditable(arg);
            this.getView().byId("delvHdrDEPARTDT").setEditable(arg);
            this.getView().byId("delvHdrEVERS").setEditable(arg);
            this.getView().byId("delvHdrDEST").setEditable(arg);
            this.getView().byId("delvHdrCOO").setEditable(arg);
            this.getView().byId("delvHdrTOTALNOPKG").setEditable(arg);
            this.getView().byId("delvHdrREFDOCNO").setEditable(arg);
            this.getView().byId("delvHdrREFDOCDT").setEditable(arg);
            this.getView().byId("delvHdrREVNO").setEditable(arg);
            this.getView().byId("delvHdrREMARKS").setEditable(arg);

            this.byId("headerForm").getFormContainers().forEach(item => {
                item.getFormElements().forEach(e => {
                    if (e.mAggregations.label.sId !== undefined) {
                        e.mAggregations.label.setProperty("required", arg);
                    }
                })
            })
        },

        setShipDetailFieldsEditable(arg) {
            this.getView().byId("shipDtlVESSEL").setEditable(arg);
            this.getView().byId("shipDtlVOYAGE").setEditable(arg);
            this.getView().byId("shipDtlCARRIER").setEditable(arg);
            this.getView().byId("shipDtlFORWRDR").setEditable(arg);
            this.getView().byId("shipDtlFORREFNO").setEditable(arg);
            this.getView().byId("shipDtlBOOKINGNO").setEditable(arg);
            this.getView().byId("shipDtlPORTLD").setEditable(arg);
            this.getView().byId("shipDtlPORTDIS").setEditable(arg);
            this.getView().byId("shipDtlETD").setEditable(arg);
            this.getView().byId("shipDtlETA").setEditable(arg);
            this.getView().byId("shipDtlHBL").setEditable(arg);
            this.getView().byId("shipDtlHBLDT").setEditable(arg);
            this.getView().byId("shipDtlMBL").setEditable(arg);
            this.getView().byId("shipDtlMBLDT").setEditable(arg);
            this.getView().byId("shipDtlCONSIGN").setEditable(arg);
            this.getView().byId("shipDtlMESSRS").setEditable(arg);
            this.getView().byId("shipDtlINVPRE").setEditable(arg);
            this.getView().byId("shipDtlINVNO").setEditable(arg);
            this.getView().byId("shipDtlINVSUF").setEditable(arg);
            this.getView().byId("shipDtlINVDT").setEditable(arg);
            this.getView().byId("shipDtlACCTTYP").setEditable(arg);
            this.getView().byId("shipDtlIMPTR").setEditable(arg);
            this.getView().byId("shipDtlEXPTR").setEditable(arg);
            this.getView().byId("shipDtlFINLDEST").setEditable(arg);
            this.getView().byId("shipDtlCONTTYP").setEditable(arg);
            this.getView().byId("shipDtlCONTNO").setEditable(arg);
            this.getView().byId("shipDtlSEALNO").setEditable(arg);
            this.getView().byId("shipDtlGRSWT").setEditable(arg);
            this.getView().byId("shipDtlNETWT").setEditable(arg);
            this.getView().byId("shipDtlWTUOM").setEditable(arg);
            this.getView().byId("shipDtlVOLUME").setEditable(arg);
            this.getView().byId("shipDtlVOLUOM").setEditable(arg);
            this.getView().byId("shipDtlNP1").setEditable(arg);
            this.getView().byId("shipDtlNP2").setEditable(arg);
            this.getView().byId("shipDtlNP3").setEditable(arg);
            this.getView().byId("shipDtlNP4").setEditable(arg);
            this.getView().byId("shipDtlEXPLICNO").setEditable(arg);
            this.getView().byId("shipDtlEXPLICDT").setEditable(arg);
            this.getView().byId("shipDtlINSPOL").setEditable(arg);
            this.getView().byId("shipDtlTCINVNO").setEditable(arg);
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
                this.getView().byId("btnSaveHdr").setVisible(false);
                this.getView().byId("btnCancelHdr").setVisible(false);

                this.getView().byId("btnEditShipDtl").setEnabled(true);
                this.getView().byId("btnAddDelvSched").setEnabled(true);
                this.getView().byId("btnDeleteDelvSched").setEnabled(true);
                this.getView().byId("btnCompleteDelvSched").setEnabled(true);
                this.getView().byId("btnRefreshDelvSched").setEnabled(true);

                var oHeaderData = this._oDataBeforeChange;
                this.getView().setModel(new JSONModel(oHeaderData), "header");
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "shipdtl-cancel") {
                this.setShipDetailFieldsEditable(false);

                this.getView().byId("btnEditShipDtl").setVisible(true);
                this.getView().byId("btnSaveShipDtl").setVisible(false);
                this.getView().byId("btnCancelShipDtl").setVisible(false);

                this.getView().byId("btnEditHdr").setEnabled(true);

                var oHeaderData = this._oDataBeforeChange;
                this.getView().setModel(new JSONModel(oHeaderData), "header");
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "delvsched-cancel") {
                var oTable = this.byId("delvSchedTab");

                this.getView().byId("btnAddDelvSched").setVisible(true);
                this.getView().byId("btnDeleteDelvSched").setVisible(true);
                this.getView().byId("btnCompleteDelvSched").setVisible(true);
                this.getView().byId("btnRefreshDelvSched").setVisible(true);
                this.getView().byId("btnAddNewDelvSched").setVisible(false);
                this.getView().byId("btnRemoveNewDelvSched").setVisible(false);
                this.getView().byId("btnSavedDelvSched").setVisible(false);
                this.getView().byId("btnCancelDelvSched").setVisible(false);

                this.getView().byId("btnEditHdr").setEnabled(true);
                oTable.getModel().setProperty("/rows", this._aDataBeforeChange);
                oTable.bindRows("/rows");
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

            this._dataMode = "READ";
            
            if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }
        },  

        onCancelConfirmDialog: function(oEvent) {
            this._ConfirmDialog.close();
        },

        onCancelExtendPODialog: function(oEvent){
            this.loadExtendPODialog.close();
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
                    oData = this.getView().getModel("shiptocust").getData();
                    oData.forEach(item => {
                        item.VHTitle = item.CUSTOMER;
                        item.VHDesc = item.CUSTGRP;
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

        handleValueHelpClose : function (oEvent) {
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
                    }
                }

                this._inputSource.setValueState("None");
            }
            else if (oEvent.sId === "cancel") {

            }
        },

        onValueHelpInputChange: function(oEvent) {
            var oSource = oEvent.getSource();
            var isInvalid = !oSource.getSelectedKey() && oSource.getValue().trim();
            oSource.setValueState(isInvalid ? "Error" : "None");

            // var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
            // var sModel = oSource.getBindingInfo("value").parts[0].model;

            oSource.getSuggestionItems().forEach(item => {
                if (item.getProperty("key") === oSource.getValue().trim()) {
                    isInvalid = false;
                    oSource.setValueState(isInvalid ? "Error" : "None");
                }
            })

            if (isInvalid) this._validationErrors.push(oEvent.getSource().getId());
            else {
                this._validationErrors.forEach((item, index) => {
                    if (item === oEvent.getSource().getId()) {
                        this._validationErrors.splice(index, 1)
                    }
                })
            }

            // this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
            // console.log(this._validationErrors);
            this._bHeaderChanged = true;
        },

        formatValueHelp: function(sKey, sColumnId) {
            // console.log(sColumnId, sKey);
            var oValue = [];
            var sValue = "";

            if (sColumnId === "EVERS") {
                oValue = me.getView().getModel("shipmode").getData().filter(v => v.SHIPMODE === sKey);

                if (oValue.length > 0) sValue = oValue[0].DESCRIPTION;

                if (this.getView().byId("delvHdrEVERS").getSelectedKey() !== sKey) {
                    this.getView().byId("delvHdrEVERS").setSelectedKey(sKey);
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

    })
})