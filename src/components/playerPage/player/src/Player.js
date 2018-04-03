import axios from 'axios'
import fscreen from './fscreen'
import {
  Zlib
} from './unzip.min.js'

export default class Player {
  constructor(source) {
    this.source = source
    this.domRefs = {
      mountNode: source.element || document.body
    }
    this.options = {
      autoPlay: false,
      // 画笔设置
      pen: {
        width: 2,
        color: 'red',
        // 绘制一条线的用时
        duration: 0.5
      },
      // 滚动一页距离需要的时间
      scrollDuration: 1,
      // 箭头渐出的时间
      arrowDuration: 0.3
    }
    this.state = {
      /* 语音是否正在加载 */
      audioLoading: false,
      /* 图片是否正在加载 */
      imagesLoading: false,
      // 资源数=音频数量+图片数量
      srcNum: 0,
      // 已经加载完成的资源数
      loadedSrcNum: 0,
      // setTimeout注册动作的返回值，暂停时需取消已注册的动作
      nextAction: null,
      nextActionIndex: 0,
      // 使用这个取消注册的动画
      animation: null,
      // 使用这个注册动画
      animationObj: null, // {points:[],start:num,delay:num}
      // 播放器处于暂停或播放状态
      halt: true,
      // 音频时长 s
      duration: 0,
    }
    // 显示画布和原始画布的比例
    this.propotion=1
    // html模板
    this.template = {
      playerControl: `<div class="player-main">
        <div class="player-section-left">
          <div class="player-section player-play player-button">
            <i class="fa fa-play"></i>
          </div>
          <div class="player-section player-time">
            <span class="current-time">%{currentTime}%</span>
            <span class="player-time-divider">/</span>
            <span class="duration">%{duration}%</span>
          </div>
        </div>
        <div class="player-section-right">
          <div class="player-section player-button player-fullscreen">
            <i class="fa fa-expand"></i>
          </div>
        </div>
        <div class="player-progress-control">
          <div class="player-progressbar-wrap">
            <div class="player-progressbar">
              <div class="player-progressbar-handle">
              <i class="fa fa-circle"></i>
              </div>
            </div>
            <div class="player-preview"></div>
          </div>
        </div>
      </div>`,
      shade: `<div class="shade"><i class="fa fa-spinner fa-spin fa-3x fa-fw"></i></div>`,
      mask: `<div class="mask">
        <i class="fa fa-play-circle-o"></i>
      </div>`
    }
    // 播放器的初始宽度
    this.initialWidth=this.domRefs.mountNode.style.width
    this.fetchActions()
  }

  fetchActions() {
    const {
      actionUrl
    } = this.source
    axios.get(actionUrl, {
      baseURL: '',
      responseType: 'json'
    }).then((res) => {
      this.source.actionData = res.data
      // 后台传来的数据进行格式化
      this.formatActionData(this.source.actionData)
      this.actions = this.source.actionData.actions
      this.actions.sort((action1, action2) => {
        return action1.startTime - action2.startTime
      })
      this.renderShade()
      this.fetchSource()
    }).catch((error) => {
      throw new Error(error)
    })
  }

  /* 渲染播放器的主体结构，添加缓冲提示图标 */
  renderShade() {
    const {
      mountNode,
    } = this.domRefs
    const {
      windowWidth,
      windowHeight
    } = this.source.actionData
    mountNode.style.position='relative'
    const container = document.createElement('div')
    container.classList.add('player-image-container')
    /* 获取到渲染节点的实际宽度，并将该宽度设置为播放器宽度 */
    let containerWidth = mountNode.offsetWidth
    /* 以上面设置的播放器宽度为基准，动态调整播放器的高度，使播放器的宽高比与录制区域的宽高 */
    /* 比相同 */
    let containerHeight = mountNode.offsetWidth * windowHeight / windowWidth
    container.style.width = `${containerWidth}px`
    container.style.height = `${containerHeight}px`
    this.domRefs.imageContainer = container
    // 记录下同原始画布的缩放比例，之后画点的位置需乘上这个比例
    /* 按理来说这两个值是相同的，因为播放器的宽高比与录制区域的宽高比相同 */
    this.propotion = containerWidth / windowWidth
    // 渲染正在加载的提示
    const template = document.createElement('template')
    template.innerHTML = this.template.shade
    const shade = template.content.firstChild
    container.appendChild(shade)
    mountNode.appendChild(container)
    this.domRefs.shade = shade
  }

  fetchSource() {
    const {
      audioUrl,
      imageUrl
    } = this.source
    // 获取音频资源
    this.fetchAudio(audioUrl)
    // 获取图片资源
    this.fetchImages(imageUrl)
  }

  fetchAudio(audioUrl) {
    this.state.srcNum += 1
    const audio = this.domRefs.audio = document.createElement('audio')
    /* 最好是先指定事件处理程序，再指定 src 属性 */
    audio.addEventListener('loadeddata', this.handleLoadedData.bind(this))
    //audio.addEventListener('durationchange',this.handleDurationChange.bind(this))
    audio.src = audioUrl
    this.state.audioLoading = true
  }

  fetchImages(imageUrl) {
    axios.get(imageUrl, {
      baseURL: '',
      responseType: 'blob'
    }).then((res) => {
      const reader = new FileReader()
      /* 改变压缩包读取完成事件处理程序的指定方式 */
      reader.onload = this.unzipImages.bind(this)
      reader.readAsArrayBuffer(res.data)
    }).catch((error) => {
      throw new Error(error)
    })
  }

  handleDurationChange(){
    this.state.duration = this.domRefs.audio.duration
    this.rerenderTimeInfo();
  }

  handleLoadedData() {
    this.state.duration = this.domRefs.audio.duration
    this.handleSrcLoaded()
  }

  unzipImages(event) {
    const unzip = new Zlib.Unzip(new Uint8Array(event.target.result))
    const filenames = unzip.getFilenames()
    this.state.srcNum += filenames.length
    this.state.imagesLoading = true
    this.domRefs.images = []
    /* 获取到播放器的宽度，并将图集中所有的图片的宽度都设置为这个值，图片的高度将保持宽高比 */
    /* 不变 */
    const imageWidth = this.domRefs.mountNode.offsetWidth
    /* 压缩包中至少含有一个图片文件，所以这里不需要对 filenames 进行是否为空的检测 */
    filenames.forEach((name) => {
      // imageData是uint8Array类型
      const imageData = unzip.decompress(name)
      // 转换成blob
      const blob = new Blob([imageData], {
        type: 'application/octet-binary'
      })
      const url = URL.createObjectURL(blob)
      const image = new Image(imageWidth)
      /* 改变图片下载完成事件处理程序的指定方式 */
      image.onload = this.handleSrcLoaded.bind(this)
      image.src = url
      /* 这里可能有问题，因为不是所有的浏览器都会将 Image 对象实现为 img 元素 */
      this.domRefs.images.push(image)
    })
  }

  /* 音频加载完成会调用这个函数，判断当前所有的资源是否全部加载完成 */
  /* 每一张图片加载完成以后调用这个函数，判断当前所有的资源是否全部加载完成 */
  handleSrcLoaded() {
    const {
      audioLoading,
      imagesLoading,
      srcNum,
    } = this.state
    this.state.loadedSrcNum += 1
    if (
      audioLoading &&
      imagesLoading &&
      this.state.loadedSrcNum === srcNum
    ) {
      /* 图片和语音都已经加载完成，可以初始化页面的 HTML 结构了 */
      this.initHtml()
      this.bindEvents()
      const shade = this.domRefs.shade
      shade.parentNode.removeChild(shade)
    }
  }

  initHtml() {
    this.renderImages()
    this.renderCanvas()
    this.renderPlayerControl()
    this.renderAudio()
  }

  renderImages() {
    const {
      images,
      imageContainer,
    } = this.domRefs
    // 挂载图片节点，置于canvas之下
    this.domRefs.pages = []
    /* 在循环中频繁操作 DOM 是很费时的，最好将要添加的 DOM 元素先添加到一个文档片段中，最 */
    /* 后一次性添加到文档中 */
    const fragment = document.createDocumentFragment()
    images.forEach((image) => {
      const section = document.createElement('section')
      section.classList.add('player-image-section')
      // 图片撑满画布宽度，高度自适应
      image.classList.add('player-image')
      section.appendChild(image)
      this.domRefs.pages.push(section)
      fragment.appendChild(section)
    })
    imageContainer.appendChild(fragment)
    /* container 节点在前面初始化缓冲图标的时候已经添加到文档中了 */
    // mountNode.appendChild(container)
  }

  renderCanvas() {
    const canvas = document.createElement('canvas')
    const offscreenCanvas=document.createElement('canvas')
    this.domRefs.canvas = canvas
    this.domRefs.offscreenCanvas=offscreenCanvas
    this.offscreenCtx=offscreenCanvas.getContext('2d')
    const {
      imageContainer,
    } = this.domRefs
    // canvas的宽和高等于底图容器，注意这里需修改canvas的width和height，而非style
    this.setCanvasSize(imageContainer.offsetWidth)
    offscreenCanvas.width=canvas.width
    offscreenCanvas.height=canvas.height
    canvas.classList.add('player-canvas')
    imageContainer.appendChild(canvas)
    /* 在 canvas 元素添加到文档中以后，再将遮罩元素添加到文档中，作为开始按钮 */
    const template = document.createElement('template')
    template.innerHTML = this.template.mask
    /* 将遮罩元素也添加到 domRefs 中 */
    this.domRefs.mask = template.content.firstChild
    imageContainer.appendChild(this.domRefs.mask)
    this.ctx = canvas.getContext('2d')
    this.ctx.lineCap = 'round'
  }

  renderAudio() {
    const {
      audio,
      mountNode
    } = this.domRefs
    /* 将音频元素添加到文档中 */
    mountNode.appendChild(audio)
    /* 将播放进度调整到开头 */
    this.changeCurrentTime(0)
    this.showPlayerControl()
    if (this.options.autoPlay) {
      this.togglePlay()
    }
  }

  renderPlayerControl() {
    const {
      mountNode,
      audio
    } = this.domRefs
    const {
      duration,
    } = this.state
    const template = document.createElement('template')
    const templateStr = this.template.playerControl
    // 将当前播放状态信息注入到html
    template.innerHTML = templateStr.replace(/%{(.*)}%/g, (match, p1) => {
      switch (p1) {
        case 'duration':
          return this.normalizeTime(duration)
        case 'currentTime':
          return this.normalizeTime(audio.currentTime)
      }
    })
    const content = template.content
    const progressbar = content.querySelector('.player-progressbar')
    progressbar.style.width = `${audio.currentTime / duration * 100}%`
    // 将控制条中点节点添加到domRefs中
    this.domRefs.progressbarWrapper = content.querySelector('.player-progressbar-wrap')
    this.domRefs.playerControl = content.firstChild
    this.domRefs.playState = content.querySelector('.player-play').firstElementChild
    this.domRefs.fullscreen = content.querySelector('.player-fullscreen').firstElementChild
    this.domRefs.duration = content.querySelector('.duration')
    this.domRefs.currentTime = content.querySelector('.current-time')
    this.domRefs.progressbar = content.querySelector('.player-progressbar')
    this.domRefs.preview = content.querySelector('.player-preview')
    this.domRefs.progressHandle = content.querySelector('.player-progressbar-handle')
    mountNode.appendChild(this.domRefs.playerControl)
  }

  bindEvents() {
    const {
      audio,
      canvas,
      fullscreen,
      mask,
      playState,
      progressbarWrapper,
      playerControl,
      progressHandle
    } = this.domRefs
    this.togglePlay = this.togglePlay.bind(this)
    this.handleFullscreenClick = this.handleFullscreenClick.bind(this)

    audio.addEventListener('timeupdate', this.handleTimeUpdate.bind(this))
    audio.addEventListener('ended', this.handleEnded.bind(this))
    playerControl.addEventListener('mouseenter', this.showPlayerControl.bind(this))
    playerControl.addEventListener('mousemove', this.showPlayerControl.bind(this))
    canvas.addEventListener('mouseenter', this.showPlayerControl.bind(this))
    canvas.addEventListener('mousemove', this.showPlayerControl.bind(this))
    canvas.addEventListener('click', this.togglePlay)
    mask.addEventListener('click', this.togglePlay)
    fullscreen.addEventListener('click', this.toggleFullscreen.bind(this))
    fscreen.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this))
    playState.addEventListener('click', this.togglePlay)
    progressbarWrapper.addEventListener('click', this.handleProgressbarClick.bind(this))
    progressbarWrapper.addEventListener('mouseover', this.handleProgressbarOver.bind(this))
    progressbarWrapper.addEventListener('mouseleave', this.handleProgressbarleave.bind(this))
    progressbarWrapper.addEventListener('mousemove', this.handleProgressbarOver.bind(this))
    progressHandle.addEventListener('mousedown', this.handleSeekMousedown.bind(this))
    window.addEventListener('orientationchange',this.handleRotateScreen.bind(this))
    window.addEventListener('resize',this.handleWindowResize.bind(this))
  }

  handleWindowResize(){
    const {mountNode}=this.domRefs
    const currentWidth=mountNode.offsetWidth
    // 如果播放器节点的宽度没有改变，则无需重设播放器宽度
    if(!this.lastWidth || this.lastWidth!==currentWidth){
      this.resizePlayer(mountNode.offsetWidth)
    }
    this.lastWidth=currentWidth
  }

  handleEnded() {
    // 将播放器暂停
    this.togglePlay()
    // 恢复初始状态
    this.changeCurrentTime(0)
  }

  handleSeekMousedown() {
    this.handleSeekMousemove = this.handleSeekMousemove.bind(this)
    this.handleSeekMouseup = this.handleSeekMouseup.bind(this)
    document.addEventListener('mousemove', this.handleSeekMousemove)
    document.addEventListener('mouseup', this.handleSeekMouseup)
  }

  handleSeekMousemove(e) {
    this.changeProgressbarHandle(e)
  }

  handleSeekMouseup() {
    document.removeEventListener('mousemove', this.handleSeekMousemove)
    document.removeEventListener('mouseup', this.handleSeekMouseup)
  }

  // 全屏状态时点击控制条之外的部分都会暂停
  handleFullscreenClick(e) {
    const {
      playerControl
    } = this.domRefs
    if (playerControl !== e.target && !(playerControl.contains(e.target))) {
      this.togglePlay(e)
    }
  }

  // 根据全屏时屏幕尺寸计算播放器需放大到的尺寸
  getFullscreenSize() {
    // 重设播放器的高宽，使之撑满屏幕
    const {
        height,
      width
      } = window.screen
    const propotion1 = height / width
    const {
        windowHeight,
      windowWidth
      } = this.source.actionData
    const propotion2 = windowHeight / windowWidth
    let containerHeight, containerWidth
    // 如果宽度撑满，高度会超出屏幕，则选择撑满高度
    if (propotion2 > propotion1) {
      containerHeight = height
      containerWidth = containerHeight / propotion2
    } else {
      containerWidth = width
      containerHeight = containerWidth * propotion2
    }
    return containerWidth;
  }

  handleRotateScreen(){
    // 若旋转了屏幕且此时处于全屏状态，需变更播放器尺寸
    if(fscreen.fullscreenElement){
      this.resizePlayer(this.getFullscreenSize());
    }
  }

  handleFullscreenChange() {
    const {
      fullscreen,
      mountNode,
      canvas,
    } = this.domRefs
    if (fscreen.fullscreenElement) {
      // 点击整个屏幕都可以暂停/播放
      document.addEventListener('click', this.handleFullscreenClick)
      canvas.removeEventListener('click', this.togglePlay)
      const fullscreenSize=this.getFullscreenSize()
      mountNode.style.width = `${fullscreenSize}px`
      this.resizePlayer(fullscreenSize);
      fullscreen.className = 'fa fa-compress'
    } else {
      document.removeEventListener('click', this.handleFullscreenClick)
      canvas.addEventListener('click', this.togglePlay)
      mountNode.style.width=this.initialWidth
      this.resizePlayer(this.playerSize)
      fullscreen.className = 'fa fa-expand'
    }
  }

  // 根据mountNode的宽度设置播放器各部件大小
  resizePlayer(containerWidth) {
    const {
      audio,
      mountNode,
      playerControl,
    } = this.domRefs
    const {
      windowWidth,
      windowHeight
    } = this.source.actionData
    const containerHeight = windowHeight / windowWidth * containerWidth
    // 修改播放器size后与原始大小的比例发生了变化
    this.propotion = containerWidth / windowWidth
    // 如果全屏，播放器控制条占满宽度
    let translateX = 0,
      controlWidth = containerWidth
    if (fscreen.fullscreenElement) {
      controlWidth = screen.width
      translateX = (screen.width - containerWidth) / 2
    }
    playerControl.style.width = `${controlWidth}px`
    // 全屏时将控制条移到最左侧
    playerControl.style.transform = `translateX(${-translateX}px)`
    this.setContainerSize(containerWidth, containerHeight)
    this.setCanvasSize(containerWidth)
    this.changeCurrentTime(audio.currentTime * 1000)
  }

  toggleFullscreen() {
    const {
      mountNode,
    } = this.domRefs
    if (fscreen.fullscreenElement) {
      fscreen.exitFullscreen()
    } else {
      // 全屏前记录下mountNode的宽度，用于之后恢复播放器的大小
      this.playerSize=mountNode.offsetWidth
      fscreen.requestFullscreen(mountNode)
    }
  }

  setContainerSize(width, height) {
    const {
      imageContainer
    } = this.domRefs
    imageContainer.style.width = `${width}px`
    imageContainer.style.height = `${height}px`
  }

  /* 修改 canvas 元素的尺寸，其中宽度与播放器的宽度相同，高度设置为与图集中最大高度的图片的 */
  /* 高度相同 */
  /* 修改 canvas 元素的尺寸，不是通过设置 CSS 属性，而是直接在 canvas 元素上设置 width */
  /* 和 height 两个特性实现的 */
  setCanvasSize(width) {
    const {
      images,
      canvas,
      offscreenCanvas
    } = this.domRefs
    canvas.width=offscreenCanvas.width = width
    canvas.height=offscreenCanvas.height = images.reduce((max, cur) => Math.max(max, cur.offsetHeight), 0)
  }

  handleTimeUpdate(e) {
    const {mountNode}=this.domRefs
    this.rerenderTimeInfo()
    const time = e.target.currentTime * 1000
    const event = new CustomEvent('timechange', { detail: { time } })
    mountNode.dispatchEvent(event)
  }

  rerenderTimeInfo() {
    const {
      state: {
        duration,
      },
      domRefs: {
        audio,
        currentTime,
        duration: durationEl,
        progressbar,
      }
    } = this
    currentTime.textContent = this.normalizeTime(audio.currentTime)
    durationEl.textContent = this.normalizeTime(duration)
    progressbar.style.width = `${audio.currentTime/duration*100}%`
  }

  handleProgressbarOver(e) {
    const {
      domRefs: {
        preview
      },
      state: {
        duration
      }
    } = this
    let time = this.getCursorTime(e)
    time = time / 1000
    preview.style.left = `${time/duration*100}%`
    preview.style.visibility = 'visible'
  }

  handleProgressbarleave() {
    const {
      preview
    } = this.domRefs
    preview.style.visibility = 'hidden'
  }

  handleProgressbarClick(e) {
    this.changeProgressbarHandle(e)
  }

  changeProgressbarHandle(e) {
    const time = this.getCursorTime(e)
    this.changeCurrentTime(time)
  }

  showPlayerControl() {
    const {
      playerControl
    } = this.domRefs
    if (this.hidePlayerControl) {
      window.clearTimeout(this.hidePlayerControl)
    }
    playerControl.classList.remove('fade-out')
    playerControl.style.opacity = '1'
    this.hidePlayerControl = window.setTimeout(this.fadeOutPlayerControl.bind(this), 3000)
  }

  fadeOutPlayerControl() {
    if (!(this.state.halt)) {
      this.domRefs.playerControl.classList.add('fade-out')
    }
  }

  // 获得鼠标放置位置的时间
  getCursorTime(e) {
    const wrapper = document.querySelector('.player-progressbar-wrap')
    let dist = e.clientX - wrapper.getBoundingClientRect().left
    dist = Math.max(0, dist)
    let percent = dist / wrapper.clientWidth
    percent=Math.min(percent,1.0)
    const time = this.state.duration * percent * 1000
    return time
  }

  togglePlay(e) {
    const {
      audio,
      playState,
      mountNode
    } = this.domRefs
    if (this.state.halt) {
      audio.play()
      this.registerNextAction()
      this.registerNextAnimation()
    } else {
      audio.pause()
      window.clearTimeout(this.state.nextAction)
      window.clearTimeout(this.state.animation)
    }
    this.state.halt = !(this.state.halt)
    playState.className = this.state.halt ? 'fa fa-play' : 'fa fa-pause'
    if (this.state.halt) {
      this.domRefs.mask.style.opacity = 1
      this.domRefs.mask.classList.add('mask-show')
    } else {
      this.domRefs.mask.style.opacity = 0
      this.domRefs.mask.classList.remove('mask-show')
    }
    this.showPlayerControl()
    if(e){
      e.stopPropagation()
    }
    const event=new CustomEvent('playtoggle',{detail:{playing:!this.state.halt}});
    mountNode.dispatchEvent(event);
  }

  // 移动进度条时调用的函数，time单位为ms
  changeCurrentTime(time) {
    const {
      domRefs: {
        audio,
        mountNode
      },
    } = this
    // 调整音频时间，可调整的最小时间间隔为 100 毫秒
    if (Math.abs(time - audio.currentTime * 1000) > 10) {
      audio.currentTime = time / 1000
    }
    // 取消已注册的动作
    window.clearTimeout(this.state.nextAction)
    // 取消当前动画
    window.clearTimeout(this.state.animation)
    this.state.animationObj = null
    // 转到time时刻所在的页面
    const page = this.getPageByTime(time)
    this.pageTo(page)
    // 重做time时刻前在page上进行过的绘制和滚动动作
    this.handlePageActions(page, time)
    // 设置下一个要注册的动作
    const next = this.getNextAction(time)
    if (next) {
      this.state.nextActionIndex = next.actionId
    } else {
      this.state.nextActionIndex = -1
    }
    if (!(this.state.halt)) {
      this.registerNextAction()
      this.registerNextAnimation()
    }
    // 重新渲染播放器控制条
    this.rerenderTimeInfo()
    const event=new CustomEvent('timechange',{detail:{time}});
    mountNode.dispatchEvent(event);
  }

  registerNextAction() {
    const {
      domRefs: {
        audio
      },
      state: {
        nextActionIndex
      }
    } = this
    if (nextActionIndex >= this.actions.length || nextActionIndex < 0) {
      return
    }
    this.state.nextAction = window.setTimeout(() => {
      this.handleNextAction(true)
    }, this.actions[nextActionIndex].startTime - audio.currentTime * 1000)
  }

  registerNextAnimation() {
    if (this.state.animationObj) {
      const {
        points,
        next,
        delay,
        step
      } = this.state.animationObj
      this.drawPoint(points, next, delay,step)
    }
  }

  handleNextAction(needRegist) {
    const {
      actions
    } = this
    const nextAction = actions[this.state.nextActionIndex]
    switch (nextAction.type) {
      case 'path':
        this.drawPath(nextAction, needRegist)
        break
      case 'arrow':
        this.drawArrow(nextAction, needRegist)
        break
      case 'scroll':
        this.scroll(nextAction, needRegist)
        break
      case 'page':
        this.page(nextAction)
        break
      case 'withdraw':
        this.withdraw(nextAction)
        break
      case 'clear':
        this.clear(nextAction)
        break
      case 'eliminate':
        this.eliminate(nextAction)
        break
    }
    // 注册下一个动作
    if (needRegist && this.state.nextActionIndex < actions.length - 1) {
      ++this.state.nextActionIndex
      this.registerNextAction()
    }
  }

  handleActions(actions, time) {
    const {
      nextActionIndex
    } = this.state
    const {canvas}=this.domRefs
    actions.forEach((action, i) => {
      if (i === actions.length - 1 && action.type === 'path') {
        const {
          startTime,
          endTime,
          points
        } = action
        const {
          options: {
            pen
          },ctx
        } = this
        const duration = endTime - startTime
        // 计算有多少点出现在time时刻前，将这些点直接绘出，其余点需通过动画
        let cnt = Math.floor((time - startTime) /duration*points.length)
        this.offscreenCtx.clearRect(0,0,canvas.width,canvas.height)
        this.offscreenCtx.drawImage(canvas,0,0)
        ctx.strokeStyle=action.color
        ctx.lineWidth=this.propotion*action.width
        this.drawPoints(points, cnt)
        if (cnt >= points.length) {
          // 所有的点都在time时刻前出现，无需注册动画
          this.state.animationObj = null
        } else {
          const {delay,step}=this.getAnimationDelay(action)
          this.state.animationObj = {
            points,
            next: Math.min(points.length-1,cnt+step-1),
            delay,
            step
          }
        }
      } else {
        this.state.nextActionIndex = action.actionId
        this.handleNextAction(false)
      }
    })
    this.state.nextActionIndex = nextActionIndex
  }

  getAnimationDelay(action){
    const {points,startTime,endTime}=action
    let duration = endTime - startTime
    let delay = duration /points.length
    let step=1
    let gap=20
    if(delay<gap){
      step=Math.ceil(gap/delay) 
      delay=gap
    }
    return {step,delay}
  }

  // 绘制points[0-end]
  drawPoints(points, end) {
    const {
      ctx
    } = this
    ctx.beginPath()
    points.slice(0, end).forEach((point, i) => {
      const x = point[0] * this.propotion,
        y = point[1] * this.propotion
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
  }

  drawPath(action, animate) {
    const {
      points,
      width,
      color,
      startTime,
      endTime
    } = action
    const {
      ctx,
      offscreenCtx,
      options: {
        pen
      },
      domRefs:{
        canvas
      }
    } = this
    if (points.length < 1) {
      return
    }
    ctx.lineWidth = width || pen.width
    ctx.lineWidth*=this.propotion
    ctx.strokeStyle = color || pen.color
    // 无动画绘制路径
    if (!animate) {
      this.drawPoints(points, points.length - 1)
    } else {
      // 有动画绘制路径
      const {delay,step}=this.getAnimationDelay(action)
      /* 保存在绘制路径前canvas的数据 */
      offscreenCtx.clearRect(0,0,canvas.width,canvas.height)
      offscreenCtx.drawImage(canvas,0,0)
      this.drawPoint(points, Math.min(points.length-1,step-1), delay,step)
    }
  }

  drawPoint(points, i, delay,step) {
    if (i < 0 || i >= points.length) {
      return
    }
    const {
      ctx
    } = this
    const {canvas,offscreenCanvas}=this.domRefs
    /* 清空画布，再重绘背景 */
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.drawImage(offscreenCanvas,0,0)
    ctx.beginPath()
    for(let k=0;k<=i;++k){
      const point=points[k]
      const x= point[0]*this.propotion
      const y=point[1]*this.propotion
      if(k===0){
        ctx.moveTo(x,y)
      } else {
        ctx.lineTo(x,y)
      }
    }
    ctx.stroke()
    if (i < points.length - 1) {
      const next=Math.min(i + step,points.length-1)
      this.state.animation = window.setTimeout(() => {
        this.drawPoint(points, next, delay,step)
      }, delay)
      this.state.animationObj = {
        points,
        next,
        delay,
        step
      }
    } else {
      this.state.animation = null
      this.state.animationObj = null
    }
  }

  drawArrow(action) {
    const {
      propotion
    } = this
    // 结束点到箭头背部的长度
    const d = 15
    // 箭头侧边与箭杆成的角度
    const angle = Math.PI / 6
    const {
      points
    } = action
    // 起始点
    const x1 = points[0][0] * propotion,
      y1 = points[0][1] * propotion
    // 结束点
    const x2 = points[1][0] * propotion,
      y2 = points[1][1] * propotion
    // 箭杆的角度
    const lineAngle = Math.atan2(y2 - y1, x2 - x1)
    // 箭头侧边的长度
    const h = Math.abs(d / Math.cos(angle))
    // 箭头上侧边的角度
    const angle1 = lineAngle + Math.PI + angle
    const topX = x2 + Math.cos(angle1) * h
    const topY = y2 + Math.sin(angle1) * h
    // 箭头下侧边的角度
    const angle2 = lineAngle + Math.PI - angle
    const botX = x2 + Math.cos(angle2) * h
    const botY = y2 + Math.sin(angle2) * h
    // 绘制箭头
    // const initAlpha=animate?0:1;
    this._drawArrow(action, x1, y1, x2, y2, topX, topY, botX, botY)
  }

  _drawArrow(action, x1, y1, x2, y2, topX, topY, botX, botY) {
    const {
      ctx,
      options: {
        pen,
      },
    } = this

    ctx.lineWidth = action.width ? action.width : pen.width
    ctx.lineWidth*=this.propotion
    ctx.strokeStyle = action.color ? action.color : pen.color
    ctx.fillStyle = ctx.strokeStyle
    // 绘制箭杆
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo((topX + botX) / 2, (topY + botY) / 2)
    ctx.stroke()
    // 绘制箭头
    ctx.moveTo(x2, y2)
    ctx.lineTo(topX, topY)
    ctx.lineTo(botX, botY)
    ctx.fill()
  }

  clear() {
    const {
      canvas
    } = this.domRefs
    this.ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  // 清除一些线
  eliminate(action){
    const currentPage=this.getPageByTime(action.startTime)
    this.handlePageActions(aucrrentPage,action.startTime+1)
  }

  // 撤销当前页的上一个绘制操作
  withdraw(action) {
    const currentPage = this.getPageByTime(action.startTime)
    this.handlePageActions(currentPage, action.startTime + 1)
  }

  scroll(action, animate) {
    const {
      images,
      canvas
    } = this.domRefs
    const {
      scrollDuration
    } = this.options
    const currentPage = this.getPageByTime(action.startTime)
    const image = images[currentPage]
    // 移动图片和canvas
    const offsetY = action.yDistance * this.propotion
    let orginOffset = 0
    let tmp = image.style.transform.match(/translateY\(-(.*)px\)/)
    if (tmp) {
      orginOffset = window.parseInt(tmp[1], 10)
    }
    const dist = Math.abs(orginOffset - offsetY)
    const duration = dist / image.offsetHeight * this.propotion * scrollDuration
    if (animate) {
      canvas.style.transition = image.style.transition = `transform ${duration}s linear`
    } else {
      canvas.style.transition = image.style.transition = ''
    }
    canvas.style.transform = image.style.transform = `translateY(${-offsetY}px)`
  }

  page(action) {
    const {
      pages,
    } = this.domRefs
    const currentPage = this.getPageByTime(action.startTime)
    const targetPage = currentPage + (action.direction == 'next' ? 1 : -1)
    if (targetPage >= pages.length || targetPage < 0) {
      return
    }
    // 转到该页
    this.pageTo(targetPage)
    this.handlePageActions(targetPage, action.startTime)
  }

  handlePageActions(page, time) {
    const {
      canvas,
      images
    } = this.domRefs
    // 重做该页之前发生过的所有动作
    this.ctx.clearRect(0, 0, canvas.width, canvas.height)
    // 因为之后要重做在page页上发生的动作（包括滚动），所以这里将该页的图片和canvas的垂直偏移置为0
    images[page].style.transform = canvas.style.transform = `translateY(0px)`
    const actions = this.getDrawActionsOnPage(page, time)
    this.handleActions(actions, time)
  }

  pageTo(targetIndex) {
    const {
      pages
    } = this.domRefs
    pages.forEach((page) => {
      page.style.transform = `translateY(-${page.offsetHeight * targetIndex}px)`
    })
  }

  // 返回time时刻所在的页码
  /* 实现方法是，从头开始计算所有的翻页动作，碰到下一页就加一，碰到上一页就减一，一直计算到 */
  /* 目标时刻之前为止，从而计算出目标时刻所对应的页数 */
  getPageByTime(time) {
    const {
      actions
    } = this
    let page = 0
    for (let i = 0; i < actions.length && actions[i].startTime < time; ++i) {
      if (actions[i].type === 'page') {
        page += actions[i].direction === 'prev' ? -1 : 1
      }
    }
    return page
  }

  // 获得time时刻前在page上进行过的所有未被撤销、未被清除的移动和绘制操作
  getDrawActionsOnPage(page, time) {
    const actions = this.getActionsOnPage(page, time)
    // 需要收集的动作类型
    const includeTypes = ['arrow', 'scroll', 'path', 'clear', 'eliminate']
    // 可以被撤销的动作类型
    const withdrawTypes = ['arrow', 'path', 'clear', 'eliminate']
    const res = []
    let eliminatedIds=[]
    for (let i = 0; i < actions.length; ++i) {
      const action = actions[i]
      // 只收集在page上进行的移动和绘制操作
      if (includeTypes.indexOf(action.type) != -1) {
        // 判断这个操作是否被之后的撤销操作撤销了 
        let withdraw = false
        if (withdrawTypes.indexOf(action.type)!=-1) {
          // 若cnt变为0，则说明这个动作被撤销了
          let cnt = 1
          // 这里加入了对page类型的判断，因为如果翻页之后再翻回来，之前的操作便不可撤销了
          for (let j = i + 1; j < actions.length&&actions[j].type!='page'; ++j) {
            if (actions[j].type == 'withdraw') {
              --cnt
              if (!cnt) {
                withdraw = true
                break
              }
            }
            if (withdrawTypes.indexOf(actions[j].type) != -1) {
              ++cnt
            }
          }
        }
        if (!withdraw) {
          if(action.type=='eliminate'){
            eliminatedIds=eliminatedIds.concat(action.eliminateIds)
          } else {
            res.push(action)
          }
        }
      }
    }
    return res.filter((action)=>{
      !action.id||eliminatedIds.indexOf(action.id)==-1
    })
  }

  // time时刻在page上进行的动作
  getActionsOnPage(page, time) {
    const {
      actions
    } = this
    let currentPage = 0
    let res = []
    for (let i = 0; i < actions.length && actions[i].startTime < time; ++i) {
      const action = actions[i]
      if (currentPage == page) {
        res.push(action)
      }
      if (action.type == 'page') {
        currentPage += action.direction == 'next' ? 1 : -1
      }
    }
    return res
  }

  // 返回time时刻的下一个动作
  getNextAction(time) {
    const {
      actions
    } = this
    for (let action of actions) {
      const {
        startTime
      } = action
      if (startTime >= time) {
        return action
      }
    }
  }

  formatActionData(actionData) {
    // 画布宽高改成整数
    actionData.windowWidth = window.parseInt(actionData.windowWidth, 10)
    actionData.windowHeight = window.parseInt(actionData.windowHeight, 10)
    actionData.actions.forEach((action, index) => {
      // 每个action加上id
      action.actionId = index
      // startTime改成ms，精确到100ms
      action.startTime = this.formatTime(action.startTime)
      if (action.endTime) {
        action.endTime = this.formatTime(action.endTime)
      }
      // width改成int
      if (action.width) {
        action.width = window.parseInt(action.width, 10)
      }
      // 点的坐标改成数组形式
      if (action.points) {
        action.points.forEach((point, i) => {
          action.points[i] = [window.parseFloat(point.x, 10), window.parseFloat(point.y, 10)]
        })
      }
      // 滑动距离改为整数
      if (action.yDistance) {
        action.yDistance = window.parseInt(action.yDistance, 10)
      }
    })
  }

  // 将s改成ms，并精确到100ms
  formatTime(time) {
    time = window.parseFloat(time, 10) * 1000
    return Math.floor(time / 100) * 100
  }

  // 将秒表示的时间转换为00:00:00格式
  normalizeTime(time) {
    // 精确到s
    time = Math.floor(time)
    let hours = Math.floor(time / 3600)
    let remain = time % 3600
    let minutes = Math.floor(remain / 60)
    let seconds = remain % 60
    let res = ''
    // 如果短于1h，不要小时段
    res += hours ? hours + ':' : ''
    // 如果前面有小时段，分钟至少为两位数
    if (hours && minutes < 10) {
      res += '0'
    }
    res += minutes + ':'
    if (seconds < 10) {
      res += '0'
    }
    res += seconds
    return res
  }
}
