const app = getApp();
const bluetooth = require("../../utils/bluetooth.js");
var utils = require("../../utils/util.js");
var plugin = requirePlugin("myPlugin");
let platform = '';
let scanDeviceTimer = null;

const serviceId = '0000FFE0-0000-1000-8000-00805F9B34FB';
const write = '0000FFE1-0000-1000-8000-00805F9B34FB';
const notify = '0000FFE2-0000-1000-8000-00805F9B34FB';
const dev = {}, sitong = {};
Page({
  data: {
    allDataList: [],
    tabitems: ["全部", "待入住", "已入住", "已退房", "已取消"],
    currentTopItem: "0",
    scrollheight: "height:" + (app.globalData.pheight - 45-48) + "px",
    currentTopItems: ["0", "1", "2", "3", '4'],
    morestate:"1",
    medalstate:"1",
    medalmsg: "1",
    enable: true,
    state: '请点击按钮开锁',
    enablestate: "立即开门",
    keyParams:""
  },
  onLoad: function (options) {
    platform = wx.getSystemInfoSync().system.split(' ')[0].toLowerCase();
  },
  onShow:function(){
    this.setData({
      allDataList: []
    });
    this.refreshNewData();
  },
  switchTab: function (e) {
    this.setData({
      currentTopItem: e.currentTarget.dataset.idx,
      morestate: "1"
    });
    this.refreshNewData();
  },
  //加载数据
  refreshNewData: function () {
    utils.showLoading();
    var athis = this;
    var fundatas={};
    if (athis.data.morestate == "1"){
      athis.setData({
        allDataList: []
      });
      fundatas={
        "check_state": athis.data.currentTopItem,
        "skey": app.globalData.skey,
        "startSize":"0"
      }
    }else{
      fundatas = {
        "check_state": athis.data.currentTopItem,
        "skey": app.globalData.skey,
        "startSize": athis.data.allDataList.length
      }
    }
    utils.request("/order/showOrder", fundatas, function (e) {
      console.log(e)
      if (e.data.result=="0") {
        wx.hideLoading();
        if (athis.data.morestate=="1"){
          athis.setData({
            allDataList: e.data.dataObject
          })
        }else{
          if (e.data.dataObject == "" || e.data.dataObject == null){
            wx.showToast({
              title: "没有更多数据",
              icon: "none",
            });
            return;
          }
          athis.setData({
            allDataList: athis.data.allDataList.concat(e.data.dataObject)
          })  
        } 
      } else if (e.data.result == "2") {
        utils.alertView("提示", "你已退出，请点击“确认”重新登录", function () {
          app.getLogin();
        })
      } else{
        utils.alertViewNosucces("提示", e.data.message + " ", false);
      }
    })
  },
  //加载更多操作
  loadMoreData: function () {
    this.setData({
      morestate:"2"
    })
    this.refreshNewData();
  },
  //滑动切换
  swiperTab: function (e) {
    if (e.detail.source =="touch"){
      this.setData({
        currentTopItem: e.detail.current,
        morestate: "1"
      });
      this.refreshNewData();
    } 
  },
  //转发
  onShareAppMessage: function (ops) {
    if (ops.from === 'button') {
      console.log(ops.target)
    }
    return {
      title: '网约房实名入住',
      path: 'pages/welcome/welcome',
      success: function (res) {
        console.log("转发成功:" + JSON.stringify(res));
      },
      fail: function (res) {
        console.log("转发失败:" + JSON.stringify(res));
      }
    }
  },
  //退订
  exitroom:function(e){
    var athis=this;
    wx.showModal({
      title: '提示',
      content: '确定要退订？',
      success(res) {
        if (res.confirm) {
          utils.showLoading("请稍等")
          utils.request("/order/retreatOrder", {
            "order_id": e.currentTarget.dataset.roomcode,
            "skey": app.globalData.skey
          }, function (res1) {
            wx.hideLoading()
            if (res1.data.result == "0") {
              wx.showToast({
                title: "退订成功",
                icon: "none",
              });
              setTimeout(function () {
                athis.setData({
                  morestate: "1"
                })
                athis.refreshNewData();
              }, 1500)
            } else {
              if (!res1.data.result) {
                utils.alertViewNosucces("提示", "服务未响应，请稍后再试", false);
                return;
              }
              utils.alertViewNosucces("提示", res1.data.message + "", false);
            }
          })
        }
      }
    })
  },

  openLockSitong() {
    let { lockid, lockname, locktype, nethouseid, oauthcode } = sitong;
    let that = this;
    bluetooth.openBluetoothAdapter(bluetooth.startBluetoothDevicesDiscovery, ({ devices }) => {
      that.setData({
        enablestate: "立即开启",
        enable: false,
        state: '请摸亮锁,并启动蓝牙'
      });

      let device
      for (let i = 0, len = devices.length; i < len; i++) {
        device = devices[i];
        if (device.name.trim() == lockname) {
          break;
        }
      }
      if (device.name.trim() != lockname) return;
      bluetooth.stopBluetoothDevicesDiscovery();

      let deviceId = device.deviceId;
      deviceId && bluetooth.createBLEConnection({
        oldDeviceId: dev.deviceId,
        lockname,
        deviceId,
        serviceId,
        notifyCharacteristicId: notify,
        createBLEConnectionSuccess: () => {
          dev.deviceId = deviceId;
        },
        onBLECharacteristicValueChange: hex => {
          //   将16进制字符串发送到服务器
          utils.request("/order/openLockCallback", {
            "skey": app.globalData.skey,
            "lock_id": lockid,
            "hexStr": hex,
            "net_house_id": nethouseid,
            "lock_name": lockname,
            "oauth_code": oauthcode
          }, ({ data: { result, errorCode, message, dataObject: hexStr } }) => {
            if (result == "0") {
              if (errorCode == "0000000") {
                if (hexStr == 24) { // 获取令牌成功，调用开锁接口
                  utils.request("/order/openLockByBluetooth", {
                    "skey": app.globalData.skey,
                    "lock_id": lockid,
                    "net_house_id": nethouseid,
                    "lock_name": lockname,
                    "oauth_code": oauthcode
                  }, ({ data: { result, errorCode, message, dataObject: hexStr } }) => {
                    if (result == "0") {
                      if (errorCode == "0000000") {
                        that.writeBLECharacteristicValue(bluetooth.hexStr2byte(hexStr), () => console.log("输出开锁命令成功"));
                      }
                    } else if (result == "2") {
                      utils.alertView("提示", "你已退出，请点击“确认”重新登录", () => app.getLogin());
                    } else {
                      utils.alertViewNosucces("提示", message, false);
                    }
                  });
                } else if (hexStr == 31) { // 开锁成功，删除所有开锁密码
                  utils.request("/order/deleteAllPwd", {
                    "skey": app.globalData.skey,
                    "lock_id": lockid,
                    "net_house_id": nethouseid,
                    "lock_name": lockname,
                    "oauth_code": oauthcode
                  }, ({ data: { result, errorCode, message, dataObject: hexStr } }) => {
                    if (result == "0") {
                      if (errorCode == "0000000") {
                        setTimeout(() => { // 等待关锁
                          that.writeBLECharacteristicValue(bluetooth.hexStr2byte(hexStr), () => console.log("输出删除所有密码命令成功"));
                        }, 8000);
                      }
                    } else if (result == "2") {
                      utils.alertView("提示", "你已退出，请点击“确认”重新登录", () => app.getLogin());
                    } else {
                      utils.alertViewNosucces("提示", message, false);
                    }
                  });
                } else if (hexStr == 116) { // 设置新的开锁密码
                  utils.request("/order/addPwdId", {
                    "skey": app.globalData.skey,
                    "lock_id": lockid,
                    "net_house_id": nethouseid,
                    "lock_name": lockname,
                    "oauth_code": oauthcode
                  }, ({ data: { result, errorCode, message, dataObject: hexStr } }) => {
                    if (result == "0") {
                      if (errorCode == "0000000") {
                        that.writeBLECharacteristicValue(bluetooth.hexStr2byte(hexStr), () => console.log("输出密码ID成功"));
                      }
                    } else if (result == "2") {
                      utils.alertView("提示", "你已退出，请点击“确认”重新登录", () => app.getLogin());
                    } else {
                      utils.alertViewNosucces("提示", message, false);
                    }
                  });
                } else if (hexStr == 113) {// 添加用户成功，添加密码
                  utils.request("/order/addPwd", {
                    "skey": app.globalData.skey,
                    "lock_id": lockid,
                    "net_house_id": nethouseid,
                    "lock_name": lockname,
                    "oauth_code": oauthcode
                  }, ({ data: { result, errorCode, message, dataObject: hexStr } }) => {
                    if (result == "0") {
                      if (errorCode == "0000000") {
                        that.writeBLECharacteristicValue(bluetooth.hexStr2byte(hexStr), () => console.log("输出密码成功"));
                      }
                    } else if (result == "2") {
                      utils.alertView("提示", "你已退出，请点击“确认”重新登录", () => app.getLogin());
                    } else {
                      utils.alertViewNosucces("提示", message, false);
                    }
                  });
                } else {
                  wx.closeBLEConnection({ // 断开蓝牙连接
                    deviceId: deviceId
                  });
                  that.setData({
                    enablestate: "立即开启",
                    enable: true,
                    state: '开启蓝牙设备失败'
                  });
                }
              }
            } else if (result == "2") {
              utils.alertView("提示", "你已退出，请点击“确认”重新登录", () => app.getLogin());
            } else {
              utils.alertViewNosucces("提示", message, false);
            }
          });
        },
        success: () => {
          utils.request("/order/getAdminPwd", {
            "skey": app.globalData.skey,
            "lock_id": lockid,
            "lock_name": lockname,
            "oauth_code": oauthcode
          }, ({ data: { result, errorCode, message, dataObject } }) => {
            if (result == "0") {
              // 将二进制报文发送到蓝牙设备
              that.writeBLECharacteristicValue(bluetooth.hexStr2byte(dataObject.adminPwd), () => console.log("输出管理员命令成功"));
            } else if (result == "2") {
              utils.alertView("提示", "你已退出，请点击“确认”重新登录", () => app.getLogin());
            } else {
              utils.alertViewNosucces("提示", message, false);
            }
          });
        }
      });
    });
  },

  writeBLECharacteristicValue(value, success) {
    wx.writeBLECharacteristicValue({
      deviceId: dev.deviceId,
      serviceId: serviceId,
      characteristicId: write,
      value: value,
      success: success,
      fail: res => console.log(res)
    });
  },

  //开门
  openroom: function (e){
    var athis=this;
    var locktype = e.currentTarget.dataset.locktype;
    var roomcode = e.currentTarget.dataset.roomcode;
    var nethouseid = e.currentTarget.dataset.nethouseid;

    var oauthcode = e.currentTarget.dataset.oauthcode;
    var lockname = e.currentTarget.dataset.lockname;
    var lockid = e.currentTarget.dataset.lockid;

    if (lockid == 12) {
      athis.setData({
        medalstate: "2",
        medalmsg: "1",
        lock_id: lockid
      })
      sitong.lockid = lockid;
      sitong.lockname = lockname;
      sitong.locktype = locktype;
      sitong.nethouseid = nethouseid;
      sitong.oauthcode = oauthcode;
      return;
    }

    if (locktype=="0000"){
      utils.showLoading("请稍等");
      utils.request("/order/blueLock", {
        "oauth_code": roomcode,
        "skey": app.globalData.skey
      }, function (res1) {
        wx.hideLoading();
        if (res1.data.result == "0") {
          var s = res1.data.dataObject
          var roomss = {
            "lockMac": s.lockMac,
            "uid": s.uid,
            lockName: s.lockName,
            "lockVersion": {
              "showAdminKbpwdFlag": s.lockVersion.showAdminKbpwdFlag,
              "groupId": s.lockVersion.groupId,
              "protocolVersion": s.lockVersion.protocolVersion,
              "protocolType": s.lockVersion.protocolType,
              "orgId": s.lockVersion.orgId,
              "logoUrl": s.lockVersion.logoUrl,
              "scene": s.lockVersion.scene
            },
            timezoneRawOffSet: s.timezoneRawOffset,
            "startDate": s.startDate,
            "endDate": s.endDate,
            "lockKey": s.lockKey,
            lockFlagPos: s.lockFlagPos,
            aesKeyStr: s.aesKeyStr
          }
          athis.setData({
            keyParams: roomss,
            medalstate: "2",
            medalmsg: "1"
          })
        } else {
          if (!res1.data.result) {
            utils.alertViewNosucces("提示", "服务未响应，请稍后再试", false);
            return;
          }
          utils.alertViewNosucces("提示", res1.data.message + "", false);
        }
      })
    } else if (locktype == "0100"){
      athis.setData({
        medalstate: "2",
        medalmsg: "2"
      })
    } else if (locktype == "0200"){
      utils.showLoading("请稍等");
      utils.request("/order/passwordLock", {
        "oauth_code": roomcode,
        "skey": app.globalData.skey
      }, function (res1) {
        wx.hideLoading();
        if (res1.data.result == "0") {
          athis.setData({
            mima: JSON.parse(res1.data.dataObject).pwd,
            medalstate: "2",
            medalmsg: "3"
          })
        } else {
          if (!res1.data.result) {
            utils.alertViewNosucces("提示", "服务未响应，请稍后再试", false);
            return;
          }
          utils.alertViewNosucces("提示", res1.data.message + "", false);
        }
      })
    } else if (locktype == "9999"){
      athis.otherLock(roomcode);
    }
  },
  //判断其它锁的情况
  otherLock: function (oauthcode) {
    utils.request("/order/otherLock", {
      "skey": app.globalData.skey,
      "oauth_code": oauthcode
    }, function (res2) {
      console.log("otherLock", res2)
      if (res2.data.result == "0") {
        utils.alertViewNosucces("提示", res2.data.message + "", false);
      } else {
        if (!res2.data.result) {
          utils.alertViewNosucces("提示", "服务未响应，请稍后再试", false);
          return;
        }
        utils.alertViewNosucces("提示", res2.data.message + "", false);
      }
    })
  },
  //关闭弹出框
  closemedal: function () {
    dev.deviceId && wx.closeBLEConnection({
      deviceId: dev.deviceId
    })
    this.setData({
      enable: true,
      medalstate: "1"
    })
  },
  //订单详情
  ordermsg:function(e){
    wx.navigateTo({
      url: '../alllist/alllistmsg?oauthcode=' + e.currentTarget.dataset.oauthcode
    })
  },


  /**
   * iOS搜索设备该接口回调目前ios有效
   */
  scanDeviceForExist() {
    let that = this;
    wx.onBluetoothDeviceFound(function (res) {
      that.scanForTargetDevice(res);
    })
  },

  /**
   * 搜索设备该接口回调android使用，非三代锁执行
   */
  scanDeviceForDynamic() {
    let that = this
    wx.getBluetoothDevices({
      success: function (res) {
        that.scanForTargetDevice(res);
      },
      fail: function (res) {
        clearTimeout(scanDeviceTimer);
        wx.stopBluetoothDevicesDiscovery({});
        this.setData({
          state: '搜索不到相关设备',
          enable: true
        });
      }
    })
  },

  /**
   * 搜索设备该接口回调android使用，非三代锁执行
   */
  scanForTargetDevice(res) {
    let that = this;
    that.setData({
      state: '设备搜索中...'
    });
    
    let DeviceArray = res.devices;
    for (let i = 0; i < DeviceArray.length; i++) {
      console.log("-扫描周边蓝牙设备---devices==" + DeviceArray[i].name);
      if (DeviceArray[i].name == that.data.keyParams.lockName) {
        that.setData({
          state: '设备已找到, 正在开锁...'
        });
        clearTimeout(scanDeviceTimer);
        that.connect2BleLock(DeviceArray[i].deviceId);
        wx.stopBluetoothDevicesDiscovery({});
        return;
      }
    }
  },

  /**
   *  开锁借口调用
   */
  connect2BleLock(deviceId) {
    let that = this
    console.log('正在开锁---' + that.data.keyParams.lockName);
    console.log(that.data.keyParams);
    plugin.UnlockBleLock(deviceId, that.data.keyParams.uid, that.data.keyParams.lockVersion, that.data.keyParams.startDate, that.data.keyParams.endDate, that.data.keyParams.lockKey, that.data.keyParams.lockFlagPos, that.data.keyParams.aesKeyStr, that.data.keyParams.timezoneRawOffSet, that.openDoorResultCallBack);
  },
  /**
   * 开锁结果回调
   * @params res 开锁返回结果参数
   */
  openDoorResultCallBack(res) {
    var athis=this;
    console.log('开锁返回结果', res);
    let result = res.success === 1 ?
      '开锁成功' :
      '开锁失败';
    setTimeout(function () {
      athis.setData({
        enable: true,
        state: result,
        enablestate: "立即开门"
      });
    }, 5000)
  },

  /** 
   * 执行开锁操作（入口）
   */
  lanyaopen() {
    let that = this;
    if (this.data.lock_id == 12) {
      this.openLockSitong();
      return;
    }
    that.setData({
      enable: false,
      state: '正在开启蓝牙设备',
      enablestate: "开启中"
    });
    wx.openBluetoothAdapter({
      success: function (res) {
        /** 三代锁并且是android 则可以直接连接 **/
        if (plugin.getLockType(that.data.keyParams.lockVersion) === plugin.LOCK_TYPE_V3 && platform === "android") {
          that.setData({
            state: '安卓搜索三代锁并尝试开启中...'
          });
          that.connect2BleLock(that.data.keyParams.lockMac);
        } else {
          /** 开启蓝牙设备搜索 **/
          that.setData({
            state: '正在开启蓝牙设备搜索...'
          });
          wx.startBluetoothDevicesDiscovery({
            services: [plugin.LOCK_BLE_UUID],
            allowDuplicatesKey: false,
            interval: 0,
            success: function (res) {
              // 搜索设备超时
              scanDeviceTimer = setTimeout(() => {
                wx.stopBluetoothDevicesDiscovery({});
                that.setData({
                  state: '搜索不到相关设备,停止搜索',
                  enable: true
                })
              }, 10000)

              /** 获取设备平台信息android和ios有部分回调表现有差异 **/
              if (platform == "ios") {
                that.scanDeviceForExist(that.data.keyParams);
              } else {
                that.scanDeviceForDynamic(that.data.keyParams);
              }
            },
            fail: function (res) {
              that.setData({
                state: '开启蓝牙设备搜索失败',
                enable: true
              })
            }
          })
        }
      },
      fail: function (res) {
        utils.alertViewNosucces("提示", "您还没有开启蓝牙，请开启", false);
        wx.onBluetoothAdapterStateChange(function (res) {
          if (res.available) {
            utils.showLoading("开启中...");
            setTimeout(function () {
              wx.hideLoading();
            }, 4000);
          }
        })
        that.setData({
          enablestate: "立即开启",
          enable: true,
          state: '开启蓝牙设备失败',
        });
      }
    })
  }
})