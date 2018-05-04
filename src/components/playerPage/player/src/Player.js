import axios from 'axios'
import Hammer from 'hammerjs'
import { Zlib } from '../lib/unzip.min'
import fscreen from '../lib/fscreen'

export default class Player {
  constructor(source) {
    this.source = source
    this.domRefs = {
      mountNode: source.element || document.body,
    }
    this.options = {
      autoPlay: false,
      // 画笔设置
      pen: {
        width: 2,
        color: 'red',
        // 绘制一条线的用时
        duration: 0.5,
      },
      // 滚动一页距离需要的时间
      scrollDuration: 1,
      // 箭头渐出的时间
      arrowDuration: 0.3,
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
      animationObj: null,
      // 播放器处于暂停或播放状态
      halt: true,
      // 是否处于网页全屏
      pageFullscreen: false,
      // 音频时长 s
      duration: source.duration,
      // 播放器将挂载在移动端或者桌面端
      mode: source.mode || 'desktop',
      // 草稿纸是否处于打开状态
      isdraftOpen: false,
      // 草稿纸的宽度，用于打开草稿纸时进行恢复
      draftWidth: 0,
      // 当前使用的草稿纸编号，从1开始
      draftNum: 1,
      // 保存所有canvas的context，一个是在课件上绘制笔迹的canvas，其余为草稿纸canvas
      contexts: [],
      // 保存课件canvas和草稿纸canvas使用的比例
      propotions: [],
      // 当前使用的比例
      propotion: 1,
      // 当前使用的context
      ctx: null,
      // 当前显示的字幕索引
      currentSubtitleIndex: 0,
      // 字幕数组
      subtitles: source.subtitles || [],
      // 是否开启字幕
      isCaptionsOpen: false,
    }
    // html模板
    this.template = {
      playerControl: `<div class="player-main">
        <div class="player-section-left">
          <button class="player-section player-play player-button" title="播放">
            <i class="fa fa-play"></i>
          </button>
          <div class="player-section player-time">
            <span class="current-time">%{currentTime}%</span>
            <span class="player-time-divider">/</span>
            <span class="duration">%{duration}%</span>
          </div>
        </div>
        <div class="player-section-right">
          <button class="player-section player-button player-toggle-captions" title="打开字幕">
            <i class="fa fa-cc"></i>
          </button>
          <button class="player-section player-button player-page-fullscreen" title="网页全屏">
            <svg class="page-fullscreen-enter" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
            viewBox="0 0 298.667 298.667" style="enable-background:new 0 0 298.667 298.667;" xml:space="preserve">
              <g>
                <polygon points="42.667,192 0,192 0,298.667 106.667,298.667 106.667,256 42.667,256 			"/>
                <polygon points="0,106.667 42.667,106.667 42.667,42.667 106.667,42.667 106.667,0 0,0 			"/>
                <polygon points="192,0 192,42.667 256,42.667 256,106.667 298.667,106.667 298.667,0 			"/>
                <polygon points="256,256 192,256 192,298.667 298.667,298.667 298.667,192 256,192 			"/>
              </g>
            </svg>
            <svg class="page-fullscreen-exit" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 469.333 469.333" style="enable-background:new 0 0 469.333 469.333;" xml:space="preserve">
              <g>
                <path d="M160,0h-21.333C132.771,0,128,4.771,128,10.667V128H10.667C4.771,128,0,132.771,0,138.667V160
                  c0,5.896,4.771,10.667,10.667,10.667H160c5.896,0,10.667-4.771,10.667-10.667V10.667C170.667,4.771,165.896,0,160,0z"/>
                <path d="M458.667,128H341.333V10.667C341.333,4.771,336.563,0,330.667,0h-21.333c-5.896,0-10.667,4.771-10.667,10.667V160
                  c0,5.896,4.771,10.667,10.667,10.667h149.333c5.896,0,10.667-4.771,10.667-10.667v-21.333
                  C469.333,132.771,464.563,128,458.667,128z"/>
                <path d="M458.667,298.667H309.333c-5.896,0-10.667,4.771-10.667,10.667v149.333c0,5.896,4.771,10.667,10.667,10.667h21.333
                  c5.896,0,10.667-4.771,10.667-10.667V341.333h117.333c5.896,0,10.667-4.771,10.667-10.667v-21.333
                  C469.333,303.437,464.563,298.667,458.667,298.667z"/>
                <path d="M160,298.667H10.667C4.771,298.667,0,303.437,0,309.333v21.333c0,5.896,4.771,10.667,10.667,10.667H128v117.333
                  c0,5.896,4.771,10.667,10.667,10.667H160c5.896,0,10.667-4.771,10.667-10.667V309.333
                  C170.667,303.437,165.896,298.667,160,298.667z"/>
              </g>
            </svg> 
          </button>
          <button class="player-section player-button player-fullscreen" title="进入全屏">
            <i class="fa fa-expand"></i>
          </button>
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
      shade: '<div class="shade"><i class="fa fa-spinner fa-spin fa-3x fa-fw"></i></div>',
      draft: '<canvas class="draft"></canvas>',
      captions: `<div class="player-captions">
        <i class="fa fa-ellipsis-v" aria-hidden="true"></i>
        <span class="player-captions-text">(播放开始时将出现字幕)</span>
      </div>`,
    }
    // 播放器的初始宽度，用于退出全屏时进行恢复
    this.initialWidth = this.domRefs.mountNode.style.width
    this.fetchActions()
  }

  fetchActions() {
    const {
      actionUrl,
    } = this.source
    axios.get(actionUrl, {
      baseURL: '',
      responseType: 'json',
    }).then((res) => {
      this.source.actionData = res.data
      // 后台传来的数据进行格式化
      Player.formatActionData(this.source.actionData)
      this.actions = this.source.actionData.actions
      this.actions.sort((action1, action2) => action1.startTime - action2.startTime)
      this.renderShade()
      this.fetchSource()
    }).catch((error) => {
      throw error
    })
  }

  /* 渲染播放器的主体结构，添加缓冲提示图标 */
  renderShade() {
    const {
      mountNode,
    } = this.domRefs
    const {
      windowWidth,
      windowHeight,
    } = this.source.actionData
    mountNode.style.position = 'relative'
    const container = document.createElement('div')
    container.classList.add('player-image-container')
    /* 获取到渲染节点的实际宽度，并将该宽度设置为播放器宽度 */
    const containerWidth = mountNode.offsetWidth
    /* 以上面设置的播放器宽度为基准，动态调整播放器的高度，使播放器的宽高比与录制区域的宽高 */
    /* 比相同 */
    const containerHeight = mountNode.offsetWidth * windowHeight / windowWidth
    container.style.width = `${containerWidth}px`
    container.style.height = `${containerHeight}px`
    this.domRefs.imageContainer = container
    // 渲染正在加载的提示
    const template = document.createElement('template')
    template.innerHTML = this.template.shade
    const shade = template.content.firstChild
    container.appendChild(shade)
    mountNode.appendChild(container)
    this.domRefs.shade = shade
    const event = new CustomEvent('actionsLoaded')
    mountNode.dispatchEvent(event)
  }

  fetchSource() {
    const {
      audioUrl,
      imageUrl,
    } = this.source
    // 获取音频资源
    this.fetchAudio(audioUrl)
    // 获取图片资源
    this.fetchImages(imageUrl)
  }

  fetchAudio(audioUrl) {
    this.state.srcNum += 1
    this.domRefs.audio = document.createElement('audio')
    const {
      audio,
    } = this.domRefs
    audio.addEventListener('loadedmetadata', this.handleSrcLoaded.bind(this))
    audio.src = audioUrl
    this.state.audioLoading = true
  }

  fetchImages(imageUrl) {
    axios.get(imageUrl, {
      baseURL: '',
      responseType: 'blob',
    }).then((res) => {
      const reader = new FileReader()
      /* 改变压缩包读取完成事件处理程序的指定方式 */
      reader.onload = this.unzipImages.bind(this)
      reader.readAsArrayBuffer(res.data)
    }).catch((error) => {
      throw error
    })
  }

  unzipImages(event) {
    const unzip = new Zlib.Unzip(new Uint8Array(event.target.result))
    const filenames = unzip.getFilenames()
    /* 将文件名按照p1,p2,p3的顺序进行排序 */
    filenames.sort((s1, s2) => {
      const pattern = /p([0-9]+)\./i
      const num1 = parseInt(s1.match(pattern)[1])
      const num2 = parseInt(s2.match(pattern)[1])
      return num1 - num2
    })
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
        type: 'application/octet-binary',
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
      this.setDrawTarget()
      /* 去除正在加载的提示 */
      const {
        shade,
      } = this.domRefs
      shade.parentNode.removeChild(shade)
      /* 将播放进度调整到开头 */
      this.changeCurrentTime(0)
      this.showPlayerControl()
      if (this.options.autoPlay) {
        this.togglePlay()
      }
    }
  }

  initHtml() {
    this.renderImages()
    this.renderCanvas()
    this.renderPlayerControl()
    this.renderCaptions()
    this.renderAudio()
    this.renderDraft()
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
  }

  renderCanvas() {
    const canvas = document.createElement('canvas')
    this.domRefs.canvas = canvas
    const {
      imageContainer,
    } = this.domRefs
    // canvas的宽和高等于底图容器，注意这里需修改canvas的width和height，而非style
    this.setCanvasSize(imageContainer.offsetWidth)
    canvas.classList.add('player-canvas')
    imageContainer.appendChild(canvas)
    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    this.state.contexts.push(ctx)
    this.setPropotions()
  }

  renderAudio() {
    const {
      audio,
      mountNode,
    } = this.domRefs
    /* 将音频元素添加到文档中 */
    mountNode.appendChild(audio)
  }

  renderPlayerControl() {
    const {
      mountNode,
      audio,
    } = this.domRefs
    const {
      duration,
      mode,
    } = this.state
    const template = document.createElement('template')
    const templateStr = this.template.playerControl
    // 将当前播放状态信息注入到html
    template.innerHTML = templateStr.replace(/%{(.*)}%/g, (match, p1) => {
      switch (p1) {
        case 'duration':
          return Player.normalizeTime(duration)
        case 'currentTime':
          return Player.normalizeTime(audio.currentTime)
        default:
          break
      }
    })
    const {
      content,
    } = template
    const progressbar = content.querySelector('.player-progressbar')
    progressbar.style.width = `${audio.currentTime / duration * 100}%`
    // 将控制条中点节点添加到domRefs中
    this.domRefs.progressbarWrapper = content.querySelector('.player-progressbar-wrap')
    this.domRefs.playerControl = content.firstChild
    this.domRefs.playState = content.querySelector('.player-play')
    this.domRefs.fullscreen = content.querySelector('.player-fullscreen')
    this.domRefs.pageFullscreen = content.querySelector('.player-page-fullscreen')
    this.domRefs.toggleCaptionsButton = content.querySelector('.player-toggle-captions')
    this.domRefs.duration = content.querySelector('.duration')
    this.domRefs.currentTime = content.querySelector('.current-time')
    this.domRefs.progressbar = content.querySelector('.player-progressbar')
    this.domRefs.preview = content.querySelector('.player-preview')
    this.domRefs.progressHandle = content.querySelector('.player-progressbar-handle')
    if (mode === 'mobile') {
      this.domRefs.pageFullscreen.style.display = 'none'
    }
    mountNode.appendChild(this.domRefs.playerControl)
  }

  renderCaptions() {
    const {
      mountNode,
      playerControl,
    } = this.domRefs
    const captionsNode = Player.renderString(mountNode, this.template.captions)
    const top = mountNode.offsetHeight - captionsNode.offsetHeight - playerControl.offsetHeight
    captionsNode.style.top = `${top / mountNode.offsetHeight * 100}%`
    if (!this.state.isCaptionsOpen) {
      captionsNode.style.display = 'none'
    }
    this.domRefs.captions = captionsNode
  }

  renderDraft() {
    const {
      imageContainer,
    } = this.domRefs
    const template = document.createElement('template')
    template.innerHTML = this.template.draft
    this.domRefs.draft = template.content.querySelector('.draft')
    const {
      draft,
    } = this.domRefs
    const ctx = draft.getContext('2d')
    ctx.lineCap = 'round'
    this.state.contexts.push(ctx)
    imageContainer.appendChild(draft)
    this.setDraftSize()
  }

  bindEvents() {
    const {
      audio,
      canvas,
      fullscreen,
      pageFullscreen,
      playState,
      progressbarWrapper,
      playerControl,
      progressHandle,
      toggleCaptionsButton,
      captions,
      draft,
    } = this.domRefs
    this.togglePlay = this.togglePlay.bind(this)
    this.handleFullscreenClick = this.handleFullscreenClick.bind(this)
    this.handleCaptionsMove = this.handleCaptionsMove.bind(this)
    this.showPlayerControl = this.showPlayerControl.bind(this)
    /* 添加PC端事件 */
    if (this.state.mode === 'desktop') {
      playerControl.addEventListener('mouseenter', this.showPlayerControl.bind(this))
      playerControl.addEventListener('mousemove', this.showPlayerControl.bind(this))
      canvas.addEventListener('mouseenter', this.showPlayerControl)
      canvas.addEventListener('mousemove', this.showPlayerControl)
      canvas.addEventListener('click', this.togglePlay, true)
      draft.addEventListener('click', this.togglePlay, true)
      fullscreen.addEventListener('click', this.toggleFullscreen.bind(this))
      pageFullscreen.addEventListener('click', this.togglePageFullscreen.bind(this))
      progressbarWrapper.addEventListener('mouseover', this.handleProgressbarOver.bind(this))
      progressbarWrapper.addEventListener('mouseleave', this.handleProgressbarleave.bind(this))
      progressbarWrapper.addEventListener('mousemove', this.handleProgressbarOver.bind(this))
      progressHandle.addEventListener('mousedown', this.handleSeekMousedown.bind(this))
      captions.addEventListener('mousedown', this.handleCaptionsDown.bind(this))
      captions.addEventListener('mouseup', this.handleCaptionsUp.bind(this))
    }
    /* 添加公共事件 */
    audio.addEventListener('timeupdate', this.handleTimeUpdate.bind(this))
    audio.addEventListener('ended', this.handleEnded.bind(this))
    playState.addEventListener('click', this.togglePlay)
    fscreen.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this))
    toggleCaptionsButton.addEventListener('click', this.toggleCaptions.bind(this))
    progressbarWrapper.addEventListener('click', this.handleProgressbarClick.bind(this))
    window.addEventListener('orientationchange', this.handleRotateScreen.bind(this))
    window.addEventListener('resize', this.handleWindowResize.bind(this))
    /* 添加移动端事件 */
    this.handleCanvasTap = this.handleCanvasTap.bind(this)
    this.handleProgressPanStart = this.handleProgressPanStart.bind(this)
    this.handleProgressPanMove = this.handleProgressPanMove.bind(this)
    this.handleCaptionsPress = this.handleCaptionsPress.bind(this)
    this.handleCaptionsPressUp = this.handleCaptionsPressUp.bind(this)
    this.handleCaptionsPanMove = this.handleCaptionsPanMove.bind(this)
    const canvasHammer = new Hammer(canvas)
    canvasHammer.on('panstart', this.handleProgressPanStart)
    canvasHammer.on('panleft panright', this.handleProgressPanMove)
    canvasHammer.on('tap', this.handleCanvasTap)
    const draftHammer = new Hammer(draft)
    draftHammer.on('tap', this.handdleCanvasTap)
    const handleHammer = new Hammer(progressHandle)
    handleHammer.on('panstart', this.handleProgressPanStart)
    handleHammer.on('panleft panright', this.handleProgressPanMove)
    const captionsHammer = new Hammer(captions)
    captionsHammer.get('pan').set({
      direction: Hammer.DIRECTION_ALL,
    })
    captionsHammer.get('press').set({
      time: 500,
    })
    captionsHammer.on('press', this.handleCaptionsPress)
    captionsHammer.on('panleft panright panup pandown', this.handleCaptionsPanMove)
    captionsHammer.on('panend', this.handleCaptionsPressUp)
  }

  handleCaptionsPress() {
    const {
      captions,
    } = this.domRefs
    /* 长按字幕可以拖动 */
    this.canCaptionsMove = true
    this.captionsStartX = captions.offsetLeft
    this.captionsStartY = captions.offsetTop
  }

  handleCaptionsPressUp() {
    this.canCaptionsMove = false
  }

  handleCaptionsPanMove(e) {
    if (this.canCaptionsMove) {
      const left = this.captionsStartX + e.deltaX
      const top = this.captionsStartY + e.deltaY
      this.setCaptionsOffset(left, top)
    }
  }

  handleProgressPanStart() {
    /* 当滑动开始时，记录下起始的时间 */
    const {
      audio,
    } = this.domRefs
    this.panStartTime = audio.currentTime
  }

  handleProgressPanMove(e) {
    const {
      progressbarWrapper,
    } = this.domRefs
    const {
      duration,
    } = this.state
    const percent = e.deltaX / progressbarWrapper.offsetWidth
    const deltaTime = duration * percent
    let time = this.panStartTime + deltaTime
    time = Math.min(duration, time)
    time = Math.max(0, time)
    this.changeCurrentTime(time * 1000)
  }

  handleCanvasTap(e) {
    e.preventDefault()
    this.showPlayerControl()
  }

  handleCaptionsDown(e) {
    const {
      captions,
    } = this.domRefs
    document.addEventListener('mousemove', this.handleCaptionsMove)
    this.captionsStartX = captions.offsetLeft
    this.captionsStartY = captions.offsetTop
    this.cursorStartX = e.clientX
    this.cursorStartY = e.clientY
  }

  handleCaptionsUp() {
    document.removeEventListener('mousemove', this.handleCaptionsMove)
  }

  handleCaptionsMove(e) {
    const distX = e.clientX - this.cursorStartX
    const distY = e.clientY - this.cursorStartY
    const left = this.captionsStartX + distX
    const top = this.captionsStartY + distY
    this.setCaptionsOffset(left, top)
  }

  setCaptionsOffset(left, top) {
    const {
      captions,
      mountNode,
      playerControl,
    } = this.domRefs
    const parentWidth = mountNode.offsetWidth
    const parentHeight = mountNode.offsetHeight
    const captionsLeftMax = parentWidth - captions.offsetWidth
    const captionsTopMax = parentHeight - captions.offsetHeight - playerControl.offsetHeight
    left = Math.max(0, left)
    left = Math.min(captionsLeftMax, left)
    top = Math.max(0, top)
    top = Math.min(captionsTopMax, top)
    captions.style.left = `${left / parentWidth * 100}%`
    captions.style.top = `${top / parentHeight * 100}%`
  }

  handleWindowResize() {
    const {
      mountNode,
    } = this.domRefs
    const currentWidth = mountNode.offsetWidth
    // 如果播放器节点的宽度没有改变，则无需重设播放器宽度
    if (!this.lastWidth || this.lastWidth !== currentWidth) {
      this.resizePlayer(mountNode.offsetWidth)
    }
    this.lastWidth = currentWidth
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
      playerControl,
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
      width,
    } = window.screen
    const propotion1 = height / width
    const {
      windowHeight,
      windowWidth,
    } = this.source.actionData
    const propotion2 = windowHeight / windowWidth
    let containerHeight
    let containerWidth
    // 如果宽度撑满，高度会超出屏幕，则选择撑满高度
    if (propotion2 > propotion1) {
      containerHeight = height
      containerWidth = containerHeight / propotion2
    } else {
      containerWidth = width
      containerHeight = containerWidth * propotion2
    }
    return containerWidth
  }

  handleRotateScreen() {
    // 若旋转了屏幕且此时处于全屏状态，需变更播放器尺寸
    if (fscreen.fullscreenElement) {
      const width = this.getFullscreenSize()
      this.domRefs.mountNode.style.width = `${width}px`
      this.resizePlayer(width)
    }
  }

  handleFullscreenChange() {
    const {
      fullscreen,
      pageFullscreen,
      mountNode,
    } = this.domRefs
    const {
      mode,
    } = this.state
    if (fscreen.fullscreenElement) {
      // 点击整个屏幕都可以暂停/播放
      if (mode === 'desktop') {
        document.addEventListener('click', this.handleFullscreenClick)
      }
      const fullscreenSize = this.getFullscreenSize()
      mountNode.style.width = `${fullscreenSize}px`
      this.resizePlayer(fullscreenSize)
      fullscreen.firstElementChild.className = 'fa fa-compress'
      fullscreen.title = '退出全屏'
      if (this.state.mode === 'desktop') {
        pageFullscreen.style.display = 'none'
      }
    } else {
      if (mode === 'desktop') {
        document.removeEventListener('click', this.handleFullscreenClick)
      }
      mountNode.style.width = this.initialWidth
      this.resizePlayer(this.playerSize)
      fullscreen.firstElementChild.className = 'fa fa-expand'
      fullscreen.title = '进入全屏'
      if (this.state.mode === 'desktop') {
        pageFullscreen.style.display = 'inline'
      }
    }
  }

  setPropotions() {
    const {
      windowWidth,
      draftHeight,
    } = this.source.actionData
    const {
      imageContainer,
    } = this.domRefs
    const {
      propotions,
    } = this.state
    propotions[0] = imageContainer.offsetWidth / windowWidth
    propotions[1] = imageContainer.offsetHeight / draftHeight
  }

  // 根据mountNode的宽度设置播放器各部件大小
  resizePlayer(containerWidth) {
    const {
      audio,
      playerControl,
      captions,
      mountNode,
    } = this.domRefs
    const {
      windowWidth,
      windowHeight,
    } = this.source.actionData
    const containerHeight = windowHeight / windowWidth * containerWidth
    // 如果全屏，播放器控制条占满宽度
    let translateX = 0
    let controlWidth = containerWidth
    if (fscreen.fullscreenElement) {
      controlWidth = window.screen.width
      translateX = (window.screen.width - containerWidth) / 2
    }
    playerControl.style.width = `${controlWidth}px`
    // 全屏时将控制条移到最左侧
    playerControl.style.transform = `translateX(${-translateX}px)`
    this.setContainerSize(containerWidth, containerHeight)
    this.setCanvasSize(containerWidth)
    // 修改播放器size后与原始大小的比例发生了变化
    this.setPropotions()
    this.setDrawTarget()
    this.setDraftSize()
    this.changeCurrentTime(audio.currentTime * 1000)
    // 重新调整字幕位置
    const captionsLeft = parseFloat(captions.style.left) / 100 * mountNode.offsetWidth
    const captionsTop = parseFloat(captions.style.top) / 100 * mountNode.offsetHeight
    this.setCaptionsOffset(captionsLeft, captionsTop)
  }

  toggleFullscreen() {
    const {
      mountNode,
    } = this.domRefs
    if (fscreen.fullscreenElement) {
      fscreen.exitFullscreen()
    } else {
      // 全屏前记录下mountNode的宽度，用于之后恢复播放器的大小
      this.playerSize = mountNode.offsetWidth
      fscreen.requestFullscreen(mountNode)
    }
  }

  togglePageFullscreen() {
    const {
      mountNode,
      pageFullscreen,
    } = this.domRefs
    this.state.pageFullscreen = !this.state.pageFullscreen
    if (this.state.pageFullscreen) {
      pageFullscreen.firstElementChild.style.display = 'none'
      pageFullscreen.lastElementChild.style.display = 'inline-block'
      mountNode.style.width = '100%'
      this.resizePlayer(mountNode.offsetWidth)
    } else {
      pageFullscreen.firstElementChild.style.display = 'inline-block'
      pageFullscreen.lastElementChild.style.display = 'none'
      mountNode.style.width = '494px'
      this.resizePlayer(mountNode.offsetWidth)
    }
  }

  toggleCaptions() {
    const {
      isCaptionsOpen,
    } = this.state
    const {
      toggleCaptionsButton,
      captions,
    } = this.domRefs
    this.state.isCaptionsOpen = !isCaptionsOpen
    if (this.state.isCaptionsOpen) {
      toggleCaptionsButton.classList.add('is-active')
      captions.style.display = 'block'
    } else {
      toggleCaptionsButton.classList.remove('is-active')
      captions.style.display = 'none'
    }
  }

  setContainerSize(width, height) {
    const {
      imageContainer,
    } = this.domRefs
    imageContainer.style.width = `${width}px`
    imageContainer.style.height = `${height}px`
  }

  /* 修改 canvas 元素的尺寸，其中宽度与播放器的宽度相同，高度设置为与图集中最大高度的图片的 */
  /* 高度相同 */
  setCanvasSize(width) {
    const {
      images,
      canvas,
    } = this.domRefs
    canvas.width = width
    canvas.height = images.reduce((max, cur) => Math.max(max, cur.offsetHeight), 0)
  }

  setDraftSize() {
    const {
      draft,
      imageContainer,
    } = this.domRefs
    const {
      draftWidth,
    } = this.source.actionData
    const {
      propotions,
    } = this.state
    const height = imageContainer.offsetHeight
    const width = draftWidth * propotions[1]
    draft.width = width
    draft.height = height
    this.state.draftWidth = width
  }

  handleTimeUpdate(e) {
    this.rerenderTimeInfo()
    const time = e.target.currentTime * 1000
    this.updateSubtitles(time)
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
      },
    } = this
    currentTime.textContent = Player.normalizeTime(audio.currentTime)
    durationEl.textContent = Player.normalizeTime(duration)
    progressbar.style.width = `${audio.currentTime / duration * 100}%`
  }

  handleProgressbarOver(e) {
    const {
      domRefs: {
        preview,
      },
      state: {
        duration,
      },
    } = this
    let time = this.getCursorTime(e)
    time /= 1000
    preview.style.left = `${time / duration * 100}%`
    preview.style.visibility = 'visible'
  }

  handleProgressbarleave() {
    const {
      preview,
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
      playerControl,
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
    percent = Math.min(percent, 1.0)
    const time = this.state.duration * percent * 1000
    return time
  }

  togglePlay(e) {
    const {
      audio,
      playState,
    } = this.domRefs
    if (this.state.halt) {
      audio.play()
      this.registerNextAction()
      this.registerNextAnimation()
    } else {
      audio.pause()
      window.clearTimeout(this.state.nextAction)
      window.cancelAnimationFrame(this.state.animation)
    }
    this.state.halt = !(this.state.halt)
    playState.title = this.state.halt ? '播放' : '暂停'
    playState.firstElementChild.className = this.state.halt ? 'fa fa-play' : 'fa fa-pause'
    this.showPlayerControl()
    if (e) {
      e.stopPropagation()
    }
  }

  // 移动进度条时调用的函数，time单位为ms
  changeCurrentTime(time) {
    const {
      domRefs: {
        audio,
      },
    } = this
    // 调整音频时间，可调整的最小时间间隔为 100 毫秒
    audio.currentTime = time / 1000
    // 取消已注册的动作
    window.clearTimeout(this.state.nextAction)
    // 取消当前动画
    window.cancelAnimationFrame(this.state.animation)
    this.state.animationObj = null
    // 转到time时刻所在的页面
    const page = this.getPageByTime(time)
    this.pageTo(page)
    // 恢复课件在time时刻的状态
    this.setPageState(page, time)
    // 恢复草稿纸在time时刻的状态
    this.setDraftState(time)
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
    this.updateSubtitles(time)
  }

  registerNextAction() {
    const {
      domRefs: {
        audio,
      },
      state: {
        nextActionIndex,
      },
    } = this
    if (nextActionIndex >= this.actions.length || nextActionIndex < 0) {
      return
    }
    this.state.nextAction = window.setTimeout(() => {
      this.handleNextAction(true)
    }, this.actions[nextActionIndex].startTime - audio.currentTime * 1000)
  }

  registerNextAnimation() {
    const {
      animationObj,
    } = this.state
    if (animationObj) {
      const {
        elaspedTime,
      } = animationObj
      animationObj.startTime = Date.now() - elaspedTime
      this.state.animation = requestAnimationFrame(this.drawPoint.bind(this))
    }
  }

  handleNextAction(needRegist) {
    const {
      actions,
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
        this.page(nextAction, needRegist)
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
      case 'draft':
        this.draft(nextAction)
        break
      default:
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
      nextActionIndex,
      ctx,
      propotion,
    } = this.state
    const {
      canvas,
    } = ctx
    actions.forEach((action, i) => {
      if (i === actions.length - 1 && action.type === 'path') {
        const {
          startTime,
          endTime,
          points,
        } = action
        const duration = endTime - startTime
        const {
          length,
        } = points
        // 计算有多少点出现在time时刻前，将这些点直接绘出，其余点需通过动画
        let cnt = Math.floor((time - startTime) / duration * length)
        cnt = Math.min(cnt, length)
        ctx.strokeStyle = action.color
        ctx.lineWidth = Math.max(propotion * action.width, 1.5)
        // 记录笔迹动画开始前的canvas数据，动画的每一帧都要恢复一次
        this.backgroundData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        this.drawPoints(points, cnt)
        if (cnt >= length) {
          // 所有的点都在time时刻前出现，无需注册动画
          this.state.animationObj = null
        } else {
          const elaspedTime = duration * (cnt / length)
          this.state.animationObj = {
            points,
            startTime: Date.now() - elaspedTime,
            duration,
            elaspedTime,
          }
        }
      } else {
        this.state.nextActionIndex = action.actionId
        this.handleNextAction(false)
      }
    })
    this.state.nextActionIndex = nextActionIndex
  }

  // 绘制points[0-end)
  drawPoints(points, end) {
    const {
      ctx,
      propotion,
    } = this.state
    ctx.beginPath()
    points.slice(0, end).forEach((point, i) => {
      const x = point[0] * propotion
      const y = point[1] * propotion
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
      endTime,
    } = action
    const {
      ctx,
      propotion,
    } = this.state
    if (!points.length) {
      return
    }
    ctx.lineWidth = width * propotion
    ctx.lineWidth = Math.max(1.5, ctx.lineWidth)
    ctx.strokeStyle = color
    if (!animate) {
      this.drawPoints(points, points.length - 1)
    } else {
      const duration = endTime - startTime
      /* 保存在绘制路径前canvas的数据 */
      this.backgroundData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
      this.state.animationObj = {
        points,
        startTime: Date.now(),
        duration,
        elaspedTime: 0,
      }
      this.state.animation = requestAnimationFrame(this.drawPoint.bind(this))
    }
  }

  drawPoint() {
    if (!this.state.animationObj) {
      return
    }
    const {
      points,
      startTime,
      duration,
    } = this.state.animationObj
    const {
      ctx,
      propotion,
    } = this.state
    const {
      length,
    } = points
    /* 清空画布，再重绘背景 */
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.putImageData(this.backgroundData, 0, 0)
    /* 计算在这一帧中需要画多少个点 */
    const elaspedTime = Date.now() - startTime
    const percent = elaspedTime / duration
    let cnt = Math.ceil(points.length * percent)
    cnt = Math.min(cnt, length)
    ctx.beginPath()
    for (let k = 0; k < cnt; ++k) {
      const point = points[k]
      const x = point[0] * propotion
      const y = point[1] * propotion
      if (k === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
    if (cnt < length) {
      this.state.animationObj.elaspedTime = elaspedTime
      this.state.animation = requestAnimationFrame(this.drawPoint.bind(this))
    } else {
      this.state.animation = null
      this.state.animationObj = null
    }
  }

  drawArrow(action) {
    const {
      propotion,
      ctx,
    } = this.state
    const {
      points,
    } = action
    ctx.lineWidth = action.width * propotion
    ctx.fillStyle = action.color
    // 起始点
    const x1 = points[0][0] * propotion
    const y1 = points[0][1] * propotion
    // 结束点
    const x2 = points[1][0] * propotion
    const y2 = points[1][1] * propotion
    // 箭杆长度
    const r = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
    const aX = x2 - (10 * propotion * (y1 - y2) / r)
    const aY = y2 - (10 * propotion * (x2 - x1) / r)
    const bX = x2 + (20 * propotion * (x2 - x1) / r)
    const bY = y2 - (20 * propotion * (y1 - y2) / r)
    const cX = x2 + (10 * propotion * (y1 - y2) / r)
    const cY = y2 + (10 * propotion * (x2 - x1) / r)
    const dX = x2 - (5 * propotion * (y1 - y2) / r)
    const dY = y2 - (5 * propotion * (x2 - x1) / r)
    const eX = x2 + (5 * propotion * (y1 - y2) / r)
    const eY = y2 + (5 * propotion * (x2 - x1) / r)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(dX, dY)
    ctx.lineTo(aX, aY)
    ctx.lineTo(bX, bY)
    ctx.lineTo(cX, cY)
    ctx.lineTo(eX, eY)
    ctx.fill()
  }

  clear() {
    const {
      ctx,
    } = this.state
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  }

  // 清除一些线
  eliminate(action) {
    if (this.state.isdraftOpen) {
      this.setDraftState(action.startTime + 1)
    } else {
      const currentPage = this.getPageByTime(action.startTime)
      this.setPageState(currentPage, action.startTime + 1)
    }
  }

  // 撤销当前页的上一个绘制操作
  withdraw(action) {
    if (this.state.isdraftOpen) {
      this.setDraftState(action.startTime + 1)
    } else {
      const currentPage = this.getPageByTime(action.startTime)
      this.setPageState(currentPage, action.startTime + 1)
    }
  }

  draft(action) {
    this.toggleDraft(action.status === 'open', true)
  }

  toggleDraft(open, animate) {
    const {
      draft,
    } = this.domRefs
    draft.style.transition = animate ? 'width 0.2s linear' : 'none'
    if (open) {
      draft.style.width = `${this.state.draftWidth}px`
      this.state.isdraftOpen = true
    } else {
      draft.style.width = '0'
      this.state.isdraftOpen = false
    }
    this.setDrawTarget()
  }

  /* 根据草稿纸是否打开，切换当前使用的canvas及比例 */
  setDrawTarget() {
    const {
      isdraftOpen,
      draftNum,
      propotions,
      contexts,
    } = this.state
    let ctxIndex = 0
    let propIndex = 0
    if (isdraftOpen) {
      ctxIndex = draftNum
      propIndex = 1
    }
    this.state.ctx = contexts[ctxIndex]
    this.state.propotion = propotions[propIndex]
  }

  scroll(action, animate) {
    const {
      images,
      canvas,
    } = this.domRefs
    const {
      scrollDuration,
    } = this.options
    const {
      propotion,
    } = this.state
    const currentPage = this.getPageByTime(action.startTime)
    const image = images[currentPage]
    // 移动图片和canvas
    const offsetY = action.yDistance * propotion
    let orginOffset = 0
    const tmp = image.style.transform.match(/translateY\(-(.*)px\)/)
    if (tmp) {
      orginOffset = window.parseInt(tmp[1], 10)
    }
    const dist = Math.abs(orginOffset - offsetY)
    const duration = dist / image.offsetHeight * propotion * scrollDuration
    if (animate) {
      image.style.transition = `transform ${duration}s linear`
      canvas.style.transition = `transform ${duration}s linear`
    } else {
      image.style.transition = ''
      canvas.style.transition = ''
    }
    image.style.transform = `translateY(${-offsetY}px)`
    canvas.style.transform = `translateY(${-offsetY}px)`
  }

  page(action, animate) {
    const {
      pages,
    } = this.domRefs
    const currentPage = this.getPageByTime(action.startTime)
    const targetPage = currentPage + (action.direction === 'next' ? 1 : -1)
    if (targetPage >= pages.length || targetPage < 0) {
      return
    }
    // 转到该页
    this.pageTo(targetPage, animate)
    if (animate) {
      const {
        canvas,
      } = this.state.ctx
      let translate = pages[0].offsetHeight
      if (action.direction === 'prev') {
        translate = -translate
      }
      canvas.style.transition = 'none'
      canvas.style.transform = `translateY(${translate}px)`
      canvas.style.transition = 'transform 0.2s ease'
      canvas.style.transform = 'translateY(0px)'
    }
    this.setPageState(targetPage, action.startTime)
  }

  setPageState(page, time) {
    const {
      images,
    } = this.domRefs
    // 关闭草稿纸，将笔迹绘制在课件上
    this.state.isdraftOpen = false
    this.setDrawTarget()
    const {
      ctx,
    } = this.state
    const {
      canvas,
    } = ctx
    // 重做该页之前发生过的所有动作
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // 因为之后要重做在page页上发生的动作（包括滚动），所以这里将该页的图片和canvas的垂直偏移置为0
    canvas.style.transform = 'translateY(0px)'
    images[page].style.transform = 'translateY(0px)'
    const actions = this.getDrawActionsOnPage(page, time)
    this.handleActions(actions, time)
  }

  /* 将草稿纸恢复到time时刻的状态 */
  setDraftState(time) {
    /* 将草稿纸设置成打开的状态 */
    this.state.isdraftOpen = true
    this.setDrawTarget()
    /* 重新绘制草稿纸上的笔迹 */
    const {
      ctx,
    } = this.state
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    const draftActions = this.getActionsOnDraft(time)
    this.handleActions(draftActions, time)
    /* 设置time时刻草稿纸的状态 */
    this.state.isdraftOpen = this.getDraftStatus(time) === 'open'
    this.toggleDraft(this.state.isdraftOpen, false)
  }

  getDraftStatus(time) {
    const {
      actions,
    } = this
    let isdraftOpen = 'close'
    for (let i = 0; i < actions.length && time > actions[i].startTime; ++i) {
      const action = actions[i]
      if (action.type === 'draft') {
        isdraftOpen = action.status
      }
    }
    return isdraftOpen
  }

  getActionsOnDraft(time) {
    const {
      actions,
    } = this
    const res = []
    let isdraftOpen = false
    for (let i = 0; i < actions.length && time > actions[i].startTime; ++i) {
      const action = actions[i]
      if (action.type === 'draft') {
        isdraftOpen = (action.status === 'open')
        continue
      }
      if (isdraftOpen) {
        res.push(action)
      }
    }
    return Player.filterActions(res)
  }

  pageTo(targetIndex, animate) {
    const {
      pages,
    } = this.domRefs
    pages.forEach((page) => {
      page.style.transition = animate ? 'transform 0.2s ease' : 'none'
      page.style.transform = `translateY(-${page.offsetHeight * targetIndex}px)`
    })
  }

  /* 返回time时刻所在的页码 */
  getPageByTime(time) {
    const {
      actions,
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
    return Player.filterActions(this.getActionsOnPage(page, time))
  }

  // 根据撤销和消除操作对actions进行过滤
  static filterActions(actions) {
    // 需要收集的动作类型
    const includeTypes = ['arrow', 'scroll', 'path', 'clear', 'eliminate']
    // 可以被撤销的动作类型
    const withdrawTypes = ['arrow', 'path', 'clear', 'eliminate']
    const res = []
    let eliminatedIds = []
    for (let i = 0; i < actions.length; ++i) {
      const action = actions[i]
      // 只收集进行的移动和绘制操作
      if (includeTypes.indexOf(action.type) !== -1) {
        // 判断这个操作是否被之后的撤销操作撤销了
        let withdraw = false
        if (withdrawTypes.indexOf(action.type) !== -1) {
          // 若cnt变为0，则说明这个动作被撤销了
          let cnt = 1
          // 这里加入了对page类型的判断，因为如果翻页之后再翻回来，之前的操作便不可撤销了
          for (let j = i + 1; j < actions.length && actions[j].type !== 'page'; ++j) {
            if (actions[j].type === 'withdraw') {
              --cnt
              if (!cnt) {
                withdraw = true
                break
              }
            }
            if (withdrawTypes.indexOf(actions[j].type) !== -1) {
              ++cnt
            }
          }
        }
        if (!withdraw) {
          if (action.type === 'eliminate') {
            eliminatedIds = eliminatedIds.concat(action.eliminateIds)
          } else {
            res.push(action)
          }
        }
      }
    }
    return res.filter(action => !action.id || eliminatedIds.indexOf(action.id) === -1)
  }

  // time时刻在page上进行的动作
  getActionsOnPage(page, time) {
    const {
      actions,
    } = this
    let currentPage = 0
    const res = []
    let isdraftOpen = false
    for (let i = 0; i < actions.length && actions[i].startTime < time; ++i) {
      const action = actions[i]
      if (action.type === 'draft') {
        isdraftOpen = action.status === 'open'
        continue
      }
      if (currentPage === page && !isdraftOpen) {
        res.push(action)
      }
      if (action.type === 'page') {
        currentPage += action.direction === 'next' ? 1 : -1
      }
    }
    return res
  }

  // 返回time时刻的下一个动作
  getNextAction(time) {
    const {
      actions,
    } = this
    for (let i = 0; i < actions.length; ++i) {
      const {
        startTime,
      } = actions[i]
      if (startTime >= time) {
        return actions[i]
      }
    }
  }

  static formatActionData(actionData) {
    // 画布宽高改成整数
    actionData.windowWidth = window.parseInt(actionData.windowWidth, 10)
    actionData.windowHeight = window.parseInt(actionData.windowHeight, 10)
    actionData.draftWidth = window.parseInt(actionData.draftWidth, 10)
    actionData.draftHeight = window.parseInt(actionData.draftHeight, 10)
    actionData.actions.forEach((action, index) => {
      // 每个action加上id
      action.actionId = index
      // startTime改成ms，精确到100ms
      action.startTime = Player.formatTime(action.startTime)
      if (action.endTime) {
        action.endTime = Player.formatTime(action.endTime)
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
  static formatTime(time) {
    time = window.parseFloat(time, 10) * 1000
    return Math.floor(time / 100) * 100
  }

  // 将秒表示的时间转换为00:00:00格式
  static normalizeTime(time) {
    // 精确到s
    time = Math.floor(time)
    const hours = Math.floor(time / 3600)
    const remain = time % 3600
    const minutes = Math.floor(remain / 60)
    const seconds = remain % 60
    let res = ''
    // 如果短于1h，不要小时段
    res += hours ? `${hours}:` : ''
    // 如果前面有小时段，分钟至少为两位数
    if (hours && minutes < 10) {
      res += '0'
    }
    res += `${minutes}:`
    if (seconds < 10) {
      res += '0'
    }
    res += seconds
    return res
  }

  updateSubtitles(currentTime) {
    const {
      subtitles,
      isCaptionsOpen,
      currentSubtitleIndex,
    } = this.state
    const {
      mountNode,
      captions,
    } = this.domRefs
    if (!subtitles.length) {
      return
    }
    /* 如果当前时间比现在字幕的时间小，则从索引0开始查，否则从当前索引开始查 */
    const begin = parseFloat(subtitles[currentSubtitleIndex].beginTime) > currentTime ? 0 : currentSubtitleIndex
    let res = -1
    let hasSubtitle = false
    let i
    for (i = begin; i < subtitles.length && parseFloat(subtitles[i].beginTime) <= currentTime; ++i) {
      if (parseFloat(subtitles[i].endTime) >= currentTime) {
        hasSubtitle = true
        res = i
        break
      }
    }
    if (!hasSubtitle) {
      res = Math.min(subtitles.length - 1, i)
    }
    /* 更新播放器字幕节点文本内容 */
    if (isCaptionsOpen) {
      if (hasSubtitle) {
        captions.style.display = 'block'
        captions.lastElementChild.textContent = subtitles[res].text
      } else {
        captions.style.display = 'none'
      }
    }
    const event = new CustomEvent('subtitlechange', {
      detail: {
        hasSubtitle,
        subtitleIndex: res,
      },
    })
    mountNode.dispatchEvent(event)
    this.state.currentSubtitleIndex = res
  }

  /* 渲染string表示的html，返回根节点 */
  static renderString(parent, string) {
    const template = document.createElement('template')
    template.innerHTML = string
    const node = template.content.firstElementChild
    parent.appendChild(node)
    return node
  }

  /* 将播放器节点从dom树中移除 */
  unmount() {
    const {
      mountNode,
    } = this.domRefs
    while (mountNode.firstElementChild) {
      mountNode.removeChild(mountNode.firstElementChild)
    }
  }
}
