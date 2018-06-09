import axios from 'axios'

const initWeiXin = () => {
  const currentURL = window.encodeURIComponent(`${window.location.protocol}//${window.location.host}`)

  axios
    .get(`authentication/signature?url=${currentURL}`)
    .catch((error) => axios.put(`authentication/signature?url=${currentURL}`))
    .then((respones) => {
      window.jWeixin.config({
        debug     : process.env.NODE_ENV === 'development', // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
        appId     : 'wx544da2871902b400', // 必填，公众号的唯一标识
        timestamp : respones.data.timestamp, // 必填，生成签名的时间戳
        nonceStr  : respones.data.noncestr, // 必填，生成签名的随机串
        signature : respones.data.signature,// 必填，签名
        jsApiList : ['onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ'] // 必填，需要使用的JS接口列表
      })
    })

  window.jWeixin.error(function (res) {
    window.setTimeout(initWeiXin(), 1000)
  })
}

export default initWeiXin
