sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "../js/Common",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    "../js/TableFilter",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,JSONModel,MessageBox,Common,Filter,FilterOperator,TableFilter) {
        "use strict";

        var me;
        var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MM/dd/yyyy" });
        var sapDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "YYYY-MM-dd" });
        var sapDateFormat2 = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyyMMdd" });
        var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({ pattern: "KK:mm:ss a" });

        return Controller.extend("zuishipdoc.controller.Main", {

            onInit: function () {
                me = this;
                this._dataMode = "READ";
                this._sActiveTable = "mainHeaderTab"; 
                // this._tableRendered = "mainHeaderTab";
                this._bHdrChanged = false;
                this._bDtlChanged = false;
                this._sbuChange = false;
                // this._bManage = false;
                this._aColumns = {};
                this._validationErrors = [];
                this._aDataBeforeChange = [];
                this._aFiltersBeforeChange = [];
                this._aMultiFiltersBeforeChange = [];
                this._aFilterableColumns = {};
                this._aColFilters = [];
                this._aColSorters = [];
                this._oModel = this.getOwnerComponent().getModel();
                this._oModelCommon = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                this._tableFilter = TableFilter;
                this._colFilters = {};
                this._oLock = [];
                this._oTables = [
                    { TableId: "mainHeaderTab" },
                    { TableId: "mainDetailTab" }
                ]

                this.getOwnerComponent().getModel("UI_MODEL").setProperty("/action", this._dataMode);
                this.getOwnerComponent().getModel("LOCK_MODEL").setProperty("/item", this._oLock);

                Common.openLoadingDialog(this);

                this.getOwnerComponent().getModel("UI_MODEL").setData({
                    sbu: "",
                    activeDlv: "",
                    action: "READ",
                    refresh: false
                });

                this.getView().setModel(new JSONModel({
                    activeDlv: ""
                }), "ui");

                this.getView().setModel(new JSONModel({
                    header: 0,
                    detail: 0
                }), "counts");

                this.byId("mainHeaderTab")
                    .setModel(new JSONModel({
                        columns: [],
                        rows: []
                }));

                this.byId("mainDetailTab")
                    .setModel(new JSONModel({
                        columns: [],
                        rows: []
                }));   

                this.setSmartFilterModel();

                var oModel = this.getOwnerComponent().getModel("ZVB_3DERP_SHIPDOC_FILTERS_CDS");

                oModel.read("/ZVB_3DERP_SBU_SH", {
                    success: function (oData, oResponse) {
                        if (oData.results.length === 1) {
                            me.getOwnerComponent().getModel("UI_MODEL").setProperty("/sbu", oData.results[0].SBU);
                            me.getDynamicColumns("SHPDOCMAINHDR", "Z3DERP_SHPDCDLVH", "mainHeaderTab");

                            setTimeout(() => {
                                me.getDynamicColumns("SHPDOCDLVSCHD", "Z3DERP_SHPDCDLVS", "mainDetailTab");
                            }, 100);
                        }
                        else {
                            // me.byId("searchFieldMain").setEnabled(false);
                            // me.byId("btnAdd").setEnabled(false);
                            // me.byId("btnEdit").setEnabled(false);
                            // me.byId("btnRefresh").setEnabled(false);
                            // me.byId("btnTabLayout").setEnabled(false);
                            // me.byId("btnManualAssign").setEnabled(false);
                        }
                    },
                    error: function (err) { }
                });

                var oDDTextParam = [], oDDTextResult = {};

                oDDTextParam.push({CODE: "SBU"});
                oDDTextParam.push({CODE: "DLVNO"});
                oDDTextParam.push({CODE: "ISSPLNT"});
                oDDTextParam.push({CODE: "SOLDTOCUST"});
                oDDTextParam.push({CODE: "EVERS"});
                oDDTextParam.push({CODE: "CUSTGRP"});
                oDDTextParam.push({CODE: "DEST"});
                oDDTextParam.push({CODE: "IONO"});
                oDDTextParam.push({CODE: "CPONO"});
                oDDTextParam.push({CODE: "BILLTOCUST"});
                oDDTextParam.push({CODE: "SALESTERM"});
                oDDTextParam.push({CODE: "SALESTERMTEXT"});
                oDDTextParam.push({CODE: "DOCDT"});
                oDDTextParam.push({CODE: "POSTDT"});
                oDDTextParam.push({CODE: "PLANDLVDT"});
                oDDTextParam.push({CODE: "INDCDT"});
                oDDTextParam.push({CODE: "EXFTYDT"});
                oDDTextParam.push({CODE: "DEPARTDT"});
                oDDTextParam.push({CODE: "COO"});
                oDDTextParam.push({CODE: "TOTALNOPKG"});
                oDDTextParam.push({CODE: "REFDOCNO"});
                oDDTextParam.push({CODE: "REFDOCDT"});
                oDDTextParam.push({CODE: "REVNO"});
                oDDTextParam.push({CODE: "REMARKS"});
                oDDTextParam.push({CODE: "STATUS"});
                oDDTextParam.push({CODE: "CREATEDBY"});
                oDDTextParam.push({CODE: "CREATEDDT"});
                oDDTextParam.push({CODE: "UPDATEDBY"});
                oDDTextParam.push({CODE: "UPDATEDDT"});
                oDDTextParam.push({CODE: "DELETED"});
                oDDTextParam.push({CODE: "VESSEL"});
                oDDTextParam.push({CODE: "VOYAGE"});
                oDDTextParam.push({CODE: "CARRIER"});
                oDDTextParam.push({CODE: "FORWRDR"});
                oDDTextParam.push({CODE: "FORREFNO"});
                oDDTextParam.push({CODE: "BOOKINGNO"});
                oDDTextParam.push({CODE: "PORTLD"});
                oDDTextParam.push({CODE: "PORTDIS"});
                oDDTextParam.push({CODE: "ETD"});
                oDDTextParam.push({CODE: "ETA"});
                oDDTextParam.push({CODE: "HBL"});
                oDDTextParam.push({CODE: "HBLDT"});
                oDDTextParam.push({CODE: "MBL"});
                oDDTextParam.push({CODE: "MBLDT"});
                oDDTextParam.push({CODE: "CONSIGN"});
                oDDTextParam.push({CODE: "MESSRS"});
                oDDTextParam.push({CODE: "INVPRE"});
                oDDTextParam.push({CODE: "INVNO"});
                oDDTextParam.push({CODE: "INVSUF"});
                oDDTextParam.push({CODE: "ACCTTYP"});
                oDDTextParam.push({CODE: "INVDT"});
                oDDTextParam.push({CODE: "IMPTR"});
                oDDTextParam.push({CODE: "EXPTR"});
                oDDTextParam.push({CODE: "FINLDEST"});
                oDDTextParam.push({CODE: "CONTTYP"});
                oDDTextParam.push({CODE: "CONTNO"});
                oDDTextParam.push({CODE: "SEALNO"});
                oDDTextParam.push({CODE: "GRSWT"});
                oDDTextParam.push({CODE: "NETWT"});
                oDDTextParam.push({CODE: "WTUOM"});
                oDDTextParam.push({CODE: "VOLUME"});
                oDDTextParam.push({CODE: "VOLUOM"});
                oDDTextParam.push({CODE: "NP1"});
                oDDTextParam.push({CODE: "NP2"});
                oDDTextParam.push({CODE: "NP3"});
                oDDTextParam.push({CODE: "NP4"});
                oDDTextParam.push({CODE: "EXPLICNO"});
                oDDTextParam.push({CODE: "EXPLICDT"});
                oDDTextParam.push({CODE: "INSPOL"});
                oDDTextParam.push({CODE: "TCINVNO"});
                oDDTextParam.push({CODE: "IODESC"});
                oDDTextParam.push({CODE: "DLVSEQ"});
                oDDTextParam.push({CODE: "CUSTSTYLE"});
                oDDTextParam.push({CODE: "DLVDT"});
                oDDTextParam.push({CODE: "REVDLVDT"});
                oDDTextParam.push({CODE: "ORDERQTY"});
                oDDTextParam.push({CODE: "REVORDERQTY"});
                oDDTextParam.push({CODE: "CPOITEM"});
                oDDTextParam.push({CODE: "CPOREV"});
                oDDTextParam.push({CODE: "CPODT"});
                oDDTextParam.push({CODE: "CUSTSHIPTO"});
                oDDTextParam.push({CODE: "MULTISOLDTO"});
                oDDTextParam.push({CODE: "DESTCD"});
                oDDTextParam.push({CODE: "CONSIGNCD"});
                oDDTextParam.push({CODE: "ADDR1"});
                oDDTextParam.push({CODE: "DLVDOCS"});
                oDDTextParam.push({CODE: "DLVSCHD"});
                oDDTextParam.push({CODE: "DLVHDR"});
                oDDTextParam.push({CODE: "SHPDTLS"});
                oDDTextParam.push({CODE: "DLVDTLS"});
                oDDTextParam.push({CODE: "DLVSTATUS"});
                oDDTextParam.push({CODE: "AVAILDLVSCHD"});
                oDDTextParam.push({CODE: "FLTRCRIT"});
                oDDTextParam.push({CODE: "OK"});
                oDDTextParam.push({CODE: "YES"});
                oDDTextParam.push({CODE: "CLRFLTRS"});
                oDDTextParam.push({CODE: "REMOVEFLTR"});
                oDDTextParam.push({CODE: "VALUELIST"});
                oDDTextParam.push({CODE: "USERDEF"});
                oDDTextParam.push({CODE: "SEARCH"});
                oDDTextParam.push({CODE: "ITEMS"});
                oDDTextParam.push({CODE: "SUBMIT"});

                oDDTextParam.push({CODE: "PLANTCD"});
                oDDTextParam.push({CODE: "DESCRIPTION"});
                oDDTextParam.push({CODE: "CUSTOMER"});
                oDDTextParam.push({CODE: "NAME1"});
                oDDTextParam.push({CODE: "SHIPMODE"});
                oDDTextParam.push({CODE: "UOM"});
                oDDTextParam.push({CODE: "DESC1"});
                oDDTextParam.push({CODE: "DESC2"});

                oDDTextParam.push({CODE: "INFO_NO_RECORD_TO_PROC"});
                oDDTextParam.push({CODE: "INFO_NO_SEL_RECORD_TO_PROC"});
                oDDTextParam.push({CODE: "INFO_NO_LAYOUT"});
                oDDTextParam.push({CODE: "INFO_LAYOUT_SAVE"});
                oDDTextParam.push({CODE: "INFO_INPUT_REQD_FIELDS"});
                oDDTextParam.push({CODE: "CONF_DISCARD_CHANGE"});
                oDDTextParam.push({CODE: "INFO_SEL_RECORD_TO_DELETE"});  
                oDDTextParam.push({CODE: "INFO_NO_RECORD_TO_DELETE"});  
                oDDTextParam.push({CODE: "INFO_DLV_DELETE_NOT_ALLOW"});
                oDDTextParam.push({CODE: "INFO_NO_RECORD_TO_REMOVE"});
                oDDTextParam.push({CODE: "INFO_SEL_RECORD_TO_REMOVE"});
                oDDTextParam.push({CODE: "INFO_DATA_DELETED"});  
                oDDTextParam.push({CODE: "CONF_DELETE_RECORDS"});  
                oDDTextParam.push({CODE: "INFO_ERROR"});
                oDDTextParam.push({CODE: "INFO_NO_DATA_SAVE"});
                oDDTextParam.push({CODE: "INFO_DATA_SAVE"});
                oDDTextParam.push({CODE: "INFO_NO_DATA_EDIT"});
                oDDTextParam.push({CODE: "INFO_CHECK_INVALID_ENTRIES"});
                oDDTextParam.push({CODE: "ADD"});
                oDDTextParam.push({CODE: "EDIT"});
                oDDTextParam.push({CODE: "SAVE"});
                oDDTextParam.push({CODE: "CANCEL"});
                oDDTextParam.push({CODE: "CLOSE"});
                oDDTextParam.push({CODE: "DELETE"});
                oDDTextParam.push({CODE: "REMOVE"});
                oDDTextParam.push({CODE: "REFRESH"});
                oDDTextParam.push({CODE: "FULLSCREEN"});
                oDDTextParam.push({CODE: "EXITFULLSCREEN"});
                oDDTextParam.push({CODE: "COMPLETE"});
                oDDTextParam.push({CODE: "INFO_NO_DATA_MODIFIED"}); 
                oDDTextParam.push({CODE: "INFO_DLV_INVOICE_REQD"}); 
                oDDTextParam.push({CODE: "INFO_DLV_INSUFFICIENT_STOCK"}); 
                oDDTextParam.push({CODE: "INFO_CHECK_INVALID_DLVQTYBSE"});
                oDDTextParam.push({CODE: "CONF_DELETE_RECORDS"});
                oDDTextParam.push({CODE: "INFO_DLV_ALREADY_COMPLETED"});
                oDDTextParam.push({CODE: "CONFIRM_SAVE_CHANGE"});
                oDDTextParam.push({CODE: "INFO_SHIPDOC_CHANGE_NOT_ALLOW"});

                this._oModelCommon.create("/CaptionMsgSet", { CaptionMsgItems: oDDTextParam  }, {
                    method: "POST",
                    success: function(oData, oResponse) {        
                        oData.CaptionMsgItems.results.forEach(item => {
                            oDDTextResult[item.CODE] = item.TEXT;
                        })

                        me.getView().setModel(new JSONModel(oDDTextResult), "ddtext");
                        me.getOwnerComponent().getModel("CAPTION_MSGS_MODEL").setData({text: oDDTextResult})
                        Common.closeLoadingDialog(me);
                    },
                    error: function(err) { }
                });

                var oTableEventDelegate = {

                    onkeyup: function (oEvent) {
                        me.onKeyUp(oEvent);
                    },

                    onAfterRendering: function (oEvent) {
                        var sTabId = this.getId().split("--")[this.getId().split("--").length - 1];

                        me._tableRendered = sTabId;
                        me.onAfterTableRendering();
                    },

                    onclick: function(oEvent) {
                        me.onTableClick(oEvent);
                    }
                };

                this.byId("mainHeaderTab").addEventDelegate(oTableEventDelegate, this.byId("mainHeaderTab"));
                this.byId("mainDetailTab").addEventDelegate(oTableEventDelegate, this.byId("mainDetailTab"));

                this.byId("mainHeaderTab").attachBrowserEvent("dblclick", function (e) {
                    e.preventDefault();
                    me.getOwnerComponent().getModel("UI_MODEL").setProperty("/action", "READ");
                    me.navToDetail();
                });

                this.getView().byId("btnAdd").setEnabled(false);
                this.getView().byId("btnEdit").setEnabled(false);
                this.getView().byId("btnRefreshHdr").setEnabled(false);
                this.getView().byId("btnRefreshDtl").setEnabled(false);

                if (sap.ui.getCore().byId("backBtn") !== undefined) {
                    this._fBackButton = sap.ui.getCore().byId("backBtn").mEventRegistry.press[0].fFunction;

                    var oView = this.getView();

                    oView.addEventDelegate({
                        onAfterShow: function(oEvent){
                            sap.ui.getCore().byId("backBtn").mEventRegistry.press[0].fFunction = me._fBackButton; 
                            
                            if (me.getOwnerComponent().getModel("UI_MODEL").getData().refresh) {
                                me.getHeaderData();
                            }

                            if (me.getOwnerComponent().getModel("LOCK_MODEL").getData().item !== undefined) { me._oLock = me.getOwnerComponent().getModel("LOCK_MODEL").getData().item; }

                            if (me._oLock.length > 0) {
                                me.unLock();
                            }
                        }
                    }, oView);
                }

                // this.getOwnerComponent().getModel("SHIPMODE_MODEL").setData({
                //     rows: []
                // });

                // this.getOwnerComponent().getModel("STATUS_MODEL").setData({
                //     rows: []
                // });

                this._oModel.read("/ShipModeSHSet", {
                    success: function (oData, oResponse) {
                        me.getView().setModel(new JSONModel(oData.results), "shipmode");
                        me.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/shipmode", oData.results);
                    },
                    error: function (err) { }
                });

                this._oModel.read("/StatusSHSet", {
                    success: function (oData, oResponse) {
                        me.getView().setModel(new JSONModel(oData.results), "status");
                        me.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/status", oData.results);
                    },
                    error: function (err) { }
                }); 

                this._oModel.read("/IssPlantSHSet", {
                    success: function (oData, oResponse) {
                        me.getView().setModel(new JSONModel(oData.results), "issplant");
                        me.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/issplant", oData.results);
                    },
                    error: function (err) { }
                });
    
                this._oModel.read("/ShipToCustSHSet", {
                    success: function (oData, oResponse) {
                        me.getView().setModel(new JSONModel(oData.results), "shiptocust");
                        me.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/shiptocust", oData.results);

                        var oSoldToCust = [];

                        oData.results.forEach(item => {
                            if (item.CUSTGRP !== "") {
                                oSoldToCust.push(item);
                            }
                        })

                        me.getView().setModel(new JSONModel(oData.results), "soldtocust");
                        me.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/soldtocust", oData.results);
                    },
                    error: function (err) { }
                });

                this._oModel.read("/CustGrpSHSet", {
                    success: function (oData, oResponse) {
                        me.getView().setModel(new JSONModel(oData.results), "custgrp");
                        me.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/custgrp", oData.results);
                    },
                    error: function (err) { }
                });
    
                this._oModel.read("/SalesTermSHSet", {
                    success: function (oData, oResponse) {
                        me.getView().setModel(new JSONModel(oData.results), "salesterm");
                        me.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/salesterm", oData.results);
                    },
                    error: function (err) { }
                });
    
                this._oModel.read("/WtUOMSHSet", {
                    success: function (oData, oResponse) {
                        me.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/wtuom", oData.results);
                    },
                    error: function (err) { }
                });
    
                this._oModel.read("/VolUOMSHSet", {
                    success: function (oData, oResponse) {
                        me.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/voluom", oData.results);
                    },
                    error: function (err) { }
                });
    
                this._oModel.read("/DestSHSet", {
                    success: function (oData, oResponse) {
                        me.getView().setModel(new JSONModel(oData.results), "dest");
                        me.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/dest", oData.results);
                    },
                    error: function (err) { }
                });

                this._oModel.read("/ConsignSHSet", {
                    urlParameters: {
                        "$filter": "CUSTGRP eq 'ABCXYZ'"
                    },
                    success: function (oData, oResponse) {
                        me.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/consign", oData.results);
                    },
                    error: function (err) { }
                });
                
                this._oModel.read("/AcctTypeSHSet", {
                    success: function (oData, oResponse) {
                        me.getOwnerComponent().getModel("LOOKUP_MODEL").setProperty("/acctyp", oData.results);
                    },
                    error: function (err) { }
                });

                // window.addEventListener('pagehide', this.exitFunction(), false);
                // window.addEventListener('onbeforeunload', this.exitFunction(), false);

                // var oView = this.getView();

                // oView.addEventDelegate({
                //     onBeforeHide: function (oEvent) {
                //         console.log("Main onBeforeHide");
                //         // alert("onBeforeHide")
                //         $(window).off('hashchange');
                //     },

                //     // saphome: function (oEvent) {
                //     //     console.log("Main saphome");
                //     // },
                // }, oView);

                // this.getOwnerComponent().getRouter().stop();
                // this.m_strHref = window.location.href;

                // $(window).off('hashchange').on('hashchange', function (e) {
                //     console.log("hashchange")
                //     // alert("hashchange")
                //     if (me.m_bSelfURLSetting) {
                //         me.m_bSelfURLSetting = false;
                //         return;
                //     }
            
                //     if (me._bHeaderChanged || me._bDelvDtlChanged) {
                //         me.unLock();
                //     }
                    
                //     me.getOwnerComponent().getRouter().initialize(false);
                // });
            },

            exitFunction: function(oEvent) {
                console.log("exit")
            },

            onSearch: function () {
                //trigger search, reselect styles
                // this.byId("searchFieldMain").setProperty("value", "");

                if (this._sbuChange) {
                    this.getOwnerComponent().getModel("UI_MODEL").setProperty("/sbu", this.byId('cboxSBU').getSelectedKey());
                    this.getDynamicColumns("SHPDOCMAINHDR", "Z3DERP_SHPDCDLVH", "mainHeaderTab");
                    
                    setTimeout(() => {
                        me.getDynamicColumns("SHPDOCDLVSCHD", "Z3DERP_SHPDCDLVS", "mainDetailTab");
                    }, 100);   
                    
                    setTimeout(() => {
                        me.getDynamicColumns("SHPDOCHDR", "Z3DERP_SHPDCDLVH", "");
                    }, 100);
                }

                this.getHeaderData();
                this._sbuChange = false;
                this._dataMode = "READ";
            },

            getHeaderData() {
                //call onSearch with prev. parameter
                Common.openProcessingDialog(this);
                // var oTable = this.byId('mainDetailTab');
                // var oColumns = oTable.getColumns();

                // for (var i = 0, l = oColumns.length; i < l; i++) {
                //     if (oColumns[i].getFiltered()) {
                //         oColumns[i].filter("");
                //     }

                //     if (oColumns[i].getSorted()) {
                //         oColumns[i].setSorted(false);
                //     }
                // }
                
                var aFilters = this.getView().byId("smartFilterBar").getFilters();   

                this._oModel.read('/HeaderSet', {
                    filters: aFilters,
                    success: function (oData) {
                        if (oData.results.length > 0) {
                            oData.results.sort((a,b) => (a.DLVNO < b.DLVNO ? 1 : -1));

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
                                    me.getView().getModel("ui").setProperty("/activeDlv", item.DLVNO);
                                }
                                else { item.ACTIVE = ""; }
                            });

                            me.getDetailData(false);
                        }
                        else {
                            me.byId("mainDetailTab").getModel().setProperty("/rows", []);
                            me.byId("mainDetailTab").bindRows("/rows");
                            me.getView().getModel("counts").setProperty("/detail", 0);
                        }
                        
                        me.byId("mainHeaderTab").getModel().setProperty("/rows", oData.results);
                        me.byId("mainHeaderTab").bindRows("/rows");
                        me.getView().getModel("counts").setProperty("/header", oData.results.length);
                        me.setActiveRowHighlightByTableId("mainHeaderTab");
                        
                        // if (me._aColFilters.length > 0) { me.setColumnFilters("mainHeaderTab"); }
                        if (me._aColSorters.length > 0) { me.setColumnSorters("mainHeaderTab"); }
                        TableFilter.applyColFilters("mainHeaderTab", me);
                    },
                    error: function (err) { 
                        Common.closeProcessingDialog(me);
                    }
                })
            },

            getDetailData(arg) {
                if (arg) Common.openProcessingDialog(me, "Processing...");

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
    
                                if (index === 0) item.ACTIVE = "X";
                                else item.ACTIVE = "";

                                if (item.CPODT !== "") item.CPODT = dateFormat.format(item.CPODT);
                                if (item.DLVDT !== "") item.DLVDT = dateFormat.format(item.DLVDT);
                                if (item.REVDLVDT !== "") item.REVDLVDT = dateFormat.format(item.REVDLVDT);

                                item.CPOITEM = item.CPOITEM + "";
                                item.CPOREV = item.CPOREV + "";
                                item.DLVSEQ = item.DLVSEQ + "";
                            });
                        }

                        me.byId("mainDetailTab").getModel().setProperty("/rows", oData.results);
                        me.byId("mainDetailTab").bindRows("/rows");
                        me.getView().getModel("counts").setProperty("/detail", oData.results.length);
                        me.setActiveRowHighlightByTableId("mainDetailTab");

                        // if (me._aColFilters.length > 0) { me.setColumnFilters("mainDetailTab"); }
                        if (me._aColSorters.length > 0) { me.setColumnSorters("mainDetailTab"); }
                        TableFilter.applyColFilters("mainDetailTab", me);

                        Common.closeProcessingDialog(me);
                    },
                    error: function (err) {
                        Common.closeProcessingDialog(me);
                    }
                })
            },

            onSBUChange: function(oEvent) {
                this._sbuChange = true;
                // this.byId("searchFieldMain").setEnabled(false);
                // this.byId("btnAssign").setEnabled(false);
                // this.byId("btnUnassign").setEnabled(false);
                // this.byId("btnCreatePO").setEnabled(false);
                // this.byId("btnTabLayout").setEnabled(false);
                // this.byId("btnManualAssign").setEnabled(false);
            },

            setSmartFilterModel: function () {
                //Model StyleHeaderFilters is for the smartfilterbar
                var oModel = this.getOwnerComponent().getModel("ZVB_3DERP_SHIPDOC_FILTERS_CDS");
                var oSmartFilter = this.getView().byId("smartFilterBar");
                oSmartFilter.setModel(oModel);
            },
            
            getDynamicColumns(arg1, arg2, arg3) {
                var sType = arg1;
                var sTabName = arg2;
                var sTabId = arg3;
                var vSBU = this.byId('cboxSBU').getSelectedKey(); 

                this._oModelCommon.setHeaders({
                    sbu: vSBU,
                    type: sType,
                    tabname: sTabName
                });

                this._oModelCommon.read("/ColumnsSet", {
                    success: function (oData) {
                        if (sType === "SHPDOCHDR") {
                            me.getOwnerComponent().getModel("COLUMNS_MODEL").setProperty("/delvHdr", oData.results);
                        }
                        else {
                            if (oData.results.length > 0) {
                                me._aColumns[sTabId.replace("Tab", "")] = oData.results;
                                me.setTableColumns(sTabId, oData.results);
                                me.byId("btnAdd").setEnabled(true);
                                me.byId("btnEdit").setEnabled(true);
                                me.byId("btnRefreshHdr").setEnabled(true);
                                me.byId("btnRefreshDtl").setEnabled(true);
                            }
                            else {
                                // MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_NO_LAYOUT"]);
    
                                var oTable = me.byId(sTabId);
                                if (oTable.getColumns().length > 0) {
                                    oTable.getModel().setProperty("/columns", []);
                                    me.getView().getModel("counts").setProperty("/header", 0);
                                    me.getView().getModel("counts").setProperty("/detail", 0);
                                }   
    
                                me.byId("btnAdd").setEnabled(false);
                                me.byId("btnEdit").setEnabled(false);
                                me.byId("btnRefreshHdr").setEnabled(false);   
                                me.byId("btnRefreshDtl").setEnabled(false);                      
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

                    var oText = new sap.m.Text({
                        wrapping: false,
                        tooltip: sColumnDataType === "BOOLEAN" ? "" : "{" + sColumnId + "}"
                    })

                    if (sColumnId === "EVERS") {
                        oText.bindText({  
                            parts: [  
                                { path: sColumnId }
                            ],  
                            formatter: function(sColumnId) {
                                var oValue = me.getView().getModel("shipmode").getData().filter(v => v.SHIPMODE === sColumnId);

                                if (oValue && oValue.length > 0) {
                                    return oValue[0].DESCRIPTION + " (" + sColumnId + ")";
                                }
                                else return sColumnId;
                            }
                        });
                    }
                    else if (sColumnId === "SALESTERM") {
                        oText.bindText({  
                            parts: [  
                                { path: sColumnId }
                            ],  
                            formatter: function(sColumnId) {
                                var oValue = me.getView().getModel("salesterm").getData().filter(v => v.SALESTERM === sColumnId);

                                if (oValue && oValue.length > 0) {
                                    return oValue[0].DESCRIPTION + " (" + sColumnId + ")";
                                }
                                else return sColumnId;
                            }
                        });
                    }
                    else if (sColumnId === "DEST") {
                        oText.bindText({  
                            parts: [  
                                { path: sColumnId }
                            ],  
                            formatter: function(sColumnId) {
                                var oValue = me.getView().getModel("dest").getData().filter(v => v.DESTCD === sColumnId);

                                if (oValue && oValue.length > 0) {
                                    return oValue[0].DESC1 + " (" + sColumnId + ")";
                                }
                                else return sColumnId;
                            }
                        });
                    }
                    else if (sColumnId === "STATUS") {
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
                    else if (sColumnId === "ISSPLNT") {
                        oText.bindText({  
                            parts: [  
                                { path: sColumnId }
                            ],  
                            formatter: function(sColumnId) {
                                var oValue = me.getView().getModel("issplant").getData().filter(v => v.PLANTCD === sColumnId);

                                if (oValue && oValue.length > 0) {
                                    return oValue[0].DESCRIPTION + " (" + sColumnId + ")";
                                }
                                else return sColumnId;
                            }
                        });
                    }
                    else if (sColumnId === "BILLTOCUST" || sColumnId === "SOLDTOCUST" || sColumnId === "CUSTSHIPTO") {
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
                    else if (sColumnId === "CUSTGRP") {
                        oText.bindText({  
                            parts: [  
                                { path: sColumnId }
                            ],  
                            formatter: function(sColumnId) {
                                var oValue = me.getView().getModel("custgrp").getData().filter(v => v.CUSTGRP === sColumnId);

                                if (oValue && oValue.length > 0) {
                                    return oValue[0].DESCRIPTION + " (" + sColumnId + ")";
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

                    return new sap.ui.table.Column({
                        id: sTabId.replace("Tab", "") + "Col" + sColumnId,
                        name: sColumnId,
                        label: new sap.m.Text({text: sColumnLabel}), 
                        template: oText,
                        width: sColumnWidth + 'px',
                        sortProperty: sColumnId,
                        // filterProperty: sColumnId,
                        autoResizable: true,
                        visible: sColumnVisible,
                        sorted: sColumnSorted,                        
                        hAlign: sColumnDataType === "NUMBER" ? "End" : sColumnDataType === "BOOLEAN" ? "Center" : "Begin",
                        sortOrder: ((sColumnSorted === true) ? sColumnSortOrder : "Ascending" ),
                    });
                });

                //date/number sorting
                oTable.attachSort(function(oEvent) {
                    var sPath = oEvent.getParameter("column").getSortProperty();
                    var bDescending = false;
                    
                    //remove sort icon of currently sorted column
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
                        oSorter.fnCompare = function(a, b) {
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

            onCreate: function (oEvent) {      
                var oTable = oEvent.getSource().oParent.oParent;
                var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
                this._sActiveTable = sTabId;
                this.createData();
            },

            createData() {
                if (this._dataMode === "READ") {
                    if (this._sActiveTable === "mainHeaderTab") {
                        this.getOwnerComponent().getModel("UI_MODEL").setProperty("/action", "NEW");
                        this.navToDetail();
                    }
                }
            },

            onEdit: function (oEvent) {
                var oTable = oEvent.getSource().oParent.oParent;
                var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
                this._sActiveTable = sTabId;
                this.editData();
            },

            editData() {
                if (this._dataMode === "READ") {
                    var me = this;
                    var oModelLock = this.getOwnerComponent().getModel("ZGW_3DERP_LOCK2_SRV");
                    var oParamLock = {
                        Lock_Unlock_Ind: "X",
                        IV_Count: 600,
                        N_DLVHDR_TAB: [{Dlvno: this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv}],
                        N_LOCK_UNLOCK_DLVHDR_RET: [],
                        N_LOCK_UNLOCK_DLVHDR_MSG: []
                    }

                    this._oLock.push(oParamLock);

                    Common.openProcessingDialog(this);
                    // console.log(oParamLock)
                    oModelLock.create("/Lock_Unlock_DlvHdrSet", oParamLock, {
                        method: "POST",
                        success: function(oData, oResponse) {
                            console.log(oData);
                            console.log(oResponse);
                            if (oData.N_LOCK_UNLOCK_DLVHDR_MSG.results[0].Type === "E"){
                                MessageBox.information(oData.N_LOCK_UNLOCK_DLVHDR_MSG.results[0].Message);
                            }
                            else {
                                me.getOwnerComponent().getModel("UI_MODEL").setProperty("/action", "EDIT");
                                me.getOwnerComponent().getModel("LOCK_MODEL").setProperty("/item", me._oLock);
                                me.navToDetail();
                            }

                            Common.closeProcessingDialog(me);
                        },
                        error: function(err) {
                            me.unLock();
                            MessageBox.error(err);
                            Common.closeProcessingDialog(me);
                        }
                    });
                } 
            },

            onRefresh: function (oEvent) {
                var oTable = oEvent.getSource().oParent.oParent;
                var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
                this._sActiveTable = sTabId;
                this.refreshData();
            },

            refreshData() {
                if (this._dataMode === "READ") {
                    if (this._sActiveTable === "mainHeaderTab") {
                        this.getHeaderData();   
                    }
                    else {
                        this.getDetailData(true);
                    }

                    this._aColFilters = this.byId(this._sActiveTable).getBinding("rows").aFilters;
                    this._aColSorters = this.byId(this._sActiveTable).getBinding("rows").aSorters;
                }
            },

            onTableResize: function(oEvent) {
                this._sActiveTable = oEvent.getSource().data("TableId");

                var vFullScreen = oEvent.getSource().data("Max") === "1" ? true : false;
                var vSuffix = oEvent.getSource().data("ButtonIdSuffix");
                var vHeader = oEvent.getSource().data("Header");
                var me = this;

                // this.byId("smartFilterBar").setFilterBarExpanded(!vFullScreen);
                // this.byId('smartFilterBar').setVisible(!vFullScreen)
                this.byId("btnFullScreen" + vSuffix).setVisible(!vFullScreen);
                this.byId("btnExitFullScreen" + vSuffix).setVisible(vFullScreen);
                // this._oTables.filter(fItem => fItem.TableId !== me._sActiveTable).forEach(item => me.byId(item.TableId).setVisible(!vFullScreen));
                // this.byId("splitter").enableAutoResize();

                if (vFullScreen) {
                    // this.byId("splitter").getAggregation("layoutData").setGrowFactor(1);

                    if (vHeader === "1") {
                        this.byId("splitterHdr").setProperty("size", "100%");
                        this.byId("splitterDtl").setProperty("size", "0%");
                    }
                    else {
                        this.byId("splitterHdr").setProperty("size", "0%");
                        this.byId("splitterDtl").setProperty("size", "100%");
                    }

                    // this.byId("splitter").disableLiveResize();
                }
                else {
                    // this.byId("smartFilterBar").getAggregation("layoutData").setGrowFactor(0.1);
                    // this.byId("splitter").getAggregation("layoutData").setGrowFactor(0.9);
                    this.byId("splitterHdr").setProperty("size", "50%");
                    this.byId("splitterDtl").setProperty("size", "50%");
                    // this.byId("splitter").enableLiveResize();
                }
            },

            onAfterTableRendering: function (oEvent) {
                if (this._tableRendered !== "") {
                    this.setActiveRowHighlightByTableId(this._tableRendered);
                    this._tableRendered = "";
                }
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

            setActiveRowHighlightByTable(arg) {
                var oTable = arg;

                setTimeout(() => {
                    oTable.getRows().forEach(row => {
                        if (row.getBindingContext() && +row.getBindingContext().sPath.replace("/rows/", "") === iActiveRowIndex) {
                            row.addStyleClass("activeRow");
                        }
                        else row.removeStyleClass("activeRow");
                    })
                }, 1);
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

            onCellClick: function (oEvent) {
                if (oEvent.getParameters().rowBindingContext) {
                    var oTable = oEvent.getSource(); //this.byId("ioMatListTab");
                    var sRowPath = oEvent.getParameters().rowBindingContext.sPath;

                    if (oTable.getId().indexOf("mainHeaderTab") >= 0) {
                        var vCurrDlv = oTable.getModel().getProperty(sRowPath + "/DLVNO");
                        var vPrevDlv = this.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv;

                        if (vCurrDlv !== vPrevDlv) {
                            this.getOwnerComponent().getModel("UI_MODEL").setProperty("/activeDlv", vCurrDlv);
                            this.getView().getModel("ui").setProperty("/activeDlv", vCurrDlv);
                            this.getDetailData(false);

                            var oTableDetail = this.byId("mainDetailTab");
                            var oColumns = oTableDetail.getColumns();

                            for (var i = 0, l = oColumns.length; i < l; i++) {
                                if (oColumns[i].getSorted()) {
                                    oColumns[i].setSorted(false);
                                }
                            }
                            
                            TableFilter.removeColFilters("mainDetailTab", this);
                        }

                        if (this._dataMode === "READ") this._sActiveTable = "mainHeaderTab";
                    }
                    else {
                        if (this._dataMode === "READ") this._sActiveTable = "mainDetailTab";
                    }

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

            onKeyUp(oEvent) {
                if ((oEvent.key === "ArrowUp" || oEvent.key === "ArrowDown") && oEvent.srcControl.sParentAggregationName === "rows") {
                    var oTable = this.byId(oEvent.srcControl.sId).oParent;
                    var sRowPath = this.byId(oEvent.srcControl.sId).getBindingContext() !== null ? this.byId(oEvent.srcControl.sId).getBindingContext().sPath : "";

                    if (oTable.getId().indexOf("mainHeaderTab") >= 0) {
                        var oRow = oTable.getModel().getProperty(sRowPath);

                        me.getOwnerComponent().getModel("UI_MODEL").setProperty("/activeDlv"    , oRow.DLVNO);
                        this.getView().getModel("ui").setProperty("/activeDlv", oRow.DLVNO);
                        this.getDetailData(false);

                        var oTableDetail = this.byId("mainDetailTab");
                        var oColumns = oTableDetail.getColumns();

                        for (var i = 0, l = oColumns.length; i < l; i++) {
                            if (oColumns[i].getSorted()) {
                                oColumns[i].setSorted(false);
                            }
                        }
                        
                        TableFilter.removeColFilters("mainDetailTab", this);
                    }

                    if (this.byId(oEvent.srcControl.sId).getBindingContext()) {
                        oTable.getModel().getData().rows.forEach(row => row.ACTIVE = "");
                        oTable.getModel().setProperty(sRowPath + "/ACTIVE", "X");

                        oTable.getRows().forEach(row => {
                            if (row.getBindingContext() && row.getBindingContext().sPath.replace("/rows/", "") === sRowPath.replace("/rows/", "")) {
                                row.addStyleClass("activeRow");
                            }
                            else row.removeStyleClass("activeRow")
                        })
                    }
                }
                else if (oEvent.key === "Enter" && oEvent.srcControl.sParentAggregationName === "rows" && oEvent.srcControl.sId.indexOf("mainHeaderTab") >= 0) {
                    this.getOwnerComponent().getModel("UI_MODEL").setProperty("/action", "READ");
                    this.navToDetail();
                }
            },

            navToDetail: function(oEvent) {
                if (me.getOwnerComponent().getModel("UI_MODEL").getData().action !== "NEW") {
                    me.getOwnerComponent().getModel("DELVDATA_MODEL").setData({
                        header: me.byId("mainHeaderTab").getModel().getData().rows.filter(item => item.DLVNO === me.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv)[0],
                        detail: me.byId("mainDetailTab").getModel().getData().rows.filter(item => item.DLVNO === me.getOwnerComponent().getModel("UI_MODEL").getData().activeDlv),
                    })
                }

                me.getOwnerComponent().getModel("UI_MODEL").setProperty("/refresh", false);

                var oRouter = sap.ui.core.UIComponent.getRouterFor(me);
                oRouter.navTo("RouteDetail"); 
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

            unLock() {
                var me = this;
                var oModelLock = this.getOwnerComponent().getModel("ZGW_3DERP_LOCK2_SRV");
                            
                var oParamLock = this._oLock[0];
                oParamLock["Lock_Unlock_Ind"] = "";

                // Common.openProcessingDialog(this);
                oModelLock.create("/Lock_Unlock_DlvHdrSet", oParamLock, {
                    method: "POST",
                    success: function(oData, oResponse) {
                        // console.log("Lock_Unlock_DlvHdrSet", oData);
                        // Common.closeProcessingDialog(me);
                        me._oLock = [];
                        me.getOwnerComponent().getModel("LOCK_MODEL").setProperty("/item", me._oLock);
                    },
                    error: function(err) {
                        MessageBox.error(err);
                        // Common.closeProcessingDialog(me);
                    }
                });                 
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

            formatTimeOffSet(pTime) {
                let TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
                return timeFormat.format(new Date(pTime + TZOffsetMs));
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

        });
    });
