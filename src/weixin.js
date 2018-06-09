import axios from 'axios'

/* 剩余请求次数 */
let remainRequestNumber = 1

const initWeiXin = () => {
  const currentURL = window.encodeURIComponent(`${window.location.protocol}//${window.location.host}`)

  /* 首先通过 GET 方法向后端发送配置数据请求信息 */
  axios
    .get(`authentication/signature?url=${currentURL}`)
    .then((respones) => {
      /* 配置微信 SDK */
      window.jWeixin.config({
        debug     : true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
        appId     : 'wx544da2871902b400', // 必填，公众号的唯一标识
        timestamp : respones.data.timestamp, // 必填，生成签名的时间戳
        nonceStr  : respones.data.noncestr, // 必填，生成签名的随机串
        signature : respones.data.signature,// 必填，签名
        jsApiList : ['onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ'] // 必填，需要使用的JS接口列表
      })
    })

  /* 如果配置出错，则发送 PUT 方法重新发送配置数据请求信息 */
  window.jWeixin.error(function (error) {
    /* 如果剩余请求次数大于零，则重新发起请求 */
    if (remainRequestNumber-- > 0) {
      axios
        .put(`authentication/signature?url=${currentURL}`)
        .then((respones) => {
          /* 配置微信 SDK */
          window.jWeixin.config({
            debug     : true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
            appId     : 'wx544da2871902b400', // 必填，公众号的唯一标识
            timestamp : respones.data.timestamp, // 必填，生成签名的时间戳
            nonceStr  : respones.data.noncestr, // 必填，生成签名的随机串
            signature : respones.data.signature,// 必填，签名
            jsApiList : ['onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ'] // 必填，需要使用的JS接口列表
          })
        })
    }
  })
}

export default initWeiXin
