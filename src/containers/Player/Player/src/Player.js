import axios from 'axios'
import Hammer from 'hammerjs'
import fscreen from '../lib/fscreen'

import './Player.css'

export default class Player {
  /* 格式化 Action 数据 */
  static formatActionData(actionData) {
    return {
      actions: actionData.actions.map((action, index) => ({
        ...action,
        actionId: index,
        color: action.color,
        endTime: action.endTime ? Math.round(window.parseFloat(action.endTime) * 10) * 100 : undefined,
        id: action.id,
        points: action.points ? action.points.map((point) => [window.parseFloat(point.x), window.parseFloat(point.y)]) : undefined,
        startTime: Math.round(window.parseFloat(action.startTime) * 10) * 100,
        target: action.target,
        type: action.type,
        width: action.width ? window.parseInt(action.width, 10) : undefined,
        yDistance: action.yDistance ? window.parseInt(action.yDistance, 10) : undefined,
      })).sort((prev, next) => prev.startTime - next.startTime),
      draftHeight: window.parseInt(actionData.draftHeight, 10),
      draftWidth: window.parseInt(actionData.draftWidth, 10),
      windowHeight: window.parseInt(actionData.windowHeight, 10),
      windowWidth: window.parseInt(actionData.windowWidth, 10),
    }
  }

  constructor({
    actionUrl,
    audioUrl,
    duration,
    element,
    imageUrls,
    mode = 'mobile',
    size,
    subtitles,
  }) {
    this.actionData = {
      actions: null,
      draftHeight: 0,
      draftWidth: 0,
      windowHeight: 0,
      windowWidth: 0,
    }
    this.domRefs = {
      audio: null,
      images: [],
      imageContainer: null,
      playerContainer: element,
    }
    this.options = {
      /* 外部实例化时传入的配置项参数 */
      actionUrl,
      audioUrl,
      duration,
      element,
      imageUrls,
      mode,
      size,
      subtitles,
      /* 滚动一页距离需要的时间，以秒为单位 */
      scrollDuration: 1,
      /* 是否自动播放 */
      autoPlay: mode === 'mobile',
      /* 字幕初始大小 */
      captionFontSize: 16,
    }
    this.state = {
      /* 语音文件加载状态 */
      audioLoadStatus: 'initial',
      /* 图集加载状态 */
      isImagesLoaded: new Array(imageUrls.length, false),
      /* setTimeout注册动作的返回值，暂停时需取消已注册的动作 */
      nextAction: null,
      nextActionIndex: 0,
      /* 使用这个取消注册的动画 */
      animation: null,
      /* 使用这个注册动画 */
      animationObj: null,
      /* 播放器处于暂停或播放状态 */
      isHalted: true,
      /* 播放器是否正在等候加载 */
      isLoading: true,
      /* 是否处于网页全屏 */
      isPageFullscreenOpen: false,
      /* 草稿纸是否处于打开状态 */
      isdraftOpen: false,
      /* 草稿纸的宽度，用于打开草稿纸时进行恢复 */
      draftWidth: 0,
      /* 当前使用的草稿纸编号，从1开始 */
      draftNum: 1,
      /* 保存所有canvas的context，一个是在课件上绘制笔迹的canvas，其余为草稿纸canvas */
      contexts: [],
      /* 保存课件canvas和草稿纸canvas使用的比例 */
      propotions: [],
      /* 当前使用的比例 */
      propotion: 1,
      /* 当前使用的context */
      ctx: null,
      /* 当前显示的字幕索引 */
      currentSubtitleIndex: 0,
      /* 字幕数组 */
      subtitles: this.options.subtitles || [],
      /* 是否开启字幕 */
      isCaptionsOpen: mode === 'mobile',
      /* 播放器的初始宽度，用于退出全屏时进行恢复 */
      initialWidth: element.offsetWidth,
      /* 用于记录加载完成后如何恢复状态，分别为正在等待加载的页码和加载成功后恢复的时刻 */
      waiting: {
        waitingPage: null,
        waitingTime: null,
      },
      /* 使用hammerJS添加移动端事件时创建的hammer */
      hammers: null,
    }
    /* html模板 */
    this.template = {
      playerControl: `
        <div class="player-main">
          <div class="player-section-left">
            <button class="player-section player-play player-button" title="播放">
              <i class="fa fa-play"></i>
            </button>
            <div class="player-section player-time">
              <span class="current-time">0</span>
              <span class="player-time-divider">/</span>
              <span class="duration">${Player.normalizeTime(this.options.duration)}</span>
            </div>
          </div>
          <div class="player-section-right">
            <button class="${'player-section player-button player-toggle-captions' + (this.state.isCaptionsOpen ? ' is-active' : '')}" title="打开字幕">
              <svg viewBox="0 0 24 24" style="display: inline-block; fill: currentcolor; user-select: none; transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z"></path>
              </svg>
            </button>
            ${
            mode === 'desktop' ?
            `<button class="player-section player-button player-page-fullscreen" title="网页全屏">
              <svg viewBox="0 0 24 24" style="display: inline-block; fill: currentcolor; user-select: none; transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path>
              </svg>
              <svg viewBox="0 0 24 24" style="display: none; fill: currentcolor; user-select: none; transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"></path>
              </svg>
            </button>`
            : ''
            }
            <button class="player-section player-button player-fullscreen" title="进入全屏">
              <svg viewBox="0 0 24 24" style="display: inline-block; fill: currentcolor; user-select: none; transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;">
                <path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3zm6 12l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87L15 21h6z"></path>
              </svg>
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
        </div>
      `,
      loadTip: `
        <div class="player-load-tip">
          <button class="player-load-button">
            <i class="fa fa-play" aria-hidden="true"></i>
            <span>${Math.round(size / 1024 / 1024)}MB流量</span>
          </button>
          <div class="player-loading">
            <i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>
            <div>正在加载...</div>
          </div>
        </div>
      `,
      draft: `
        <canvas class="draft"></canvas>
      `,
      captions: `
        <div class="player-captions">
          ${mode === 'desktop' ? '<i class="fa fa-ellipsis-v" aria-hidden="true"></i>' : ''}
          <span class="player-captions-text">(播放开始时将出现字幕)</span>
        </div>
      `,
    }
    this.fetchActions()
    this.fetchImages()
  }

  fetchActions() {
    axios
      .get(this.options.actionUrl, {
        baseURL: '',
        responseType: 'json',
      })
      .then((response) => {
        /* 对数据进行格式化处理 */
        this.actionData = Player.formatActionData(response.data)
        this.renderContainer()
        this.renderImages()
      })
      .catch((error) => {
        throw error
      })
  }

  /* 渲染播放器的主体结构，添加缓冲提示 */
  renderContainer() {
    const {
      actionData: {
        windowHeight,
        windowWidth,
      },
      domRefs: {
        playerContainer,
      },
      options: {
        mode,
      },
      template: {
        loadTip,
      },
    } = this

    const container = document.createElement('div')
    container.className = 'player-image-container'

    /* 播放器高度由宽度按比例计算得出 */
    const containerWidth = playerContainer.offsetWidth
    const containerHeight = containerWidth * windowHeight / windowWidth
    container.style.width = `${containerWidth}px`
    container.style.height = `${containerHeight}px`

    playerContainer.appendChild(container)

    /* 渲染正在加载的提示 */
    const loadTipElem = Player.renderStringToNode(container, loadTip)

    /* 保存常用的dom节点 */
    this.domRefs.loadTip = loadTipElem
    this.domRefs.imageContainer = container
    this.domRefs.loading = loadTipElem.querySelector('.player-loading')

    /* 通知徐子菁此时可以获得播放器的宽高属性了 */
    const event = new CustomEvent('actionsLoaded')
    playerContainer.dispatchEvent(event)

    this.fetchSource = this.fetchSource.bind(this)
    /* 如果为移动端，则显示当前需要下载的资源的大小而不是直接下载资源 */
    const loadButton = loadTipElem.querySelector('.player-load-button')
    if (mode === 'mobile') {
      loadButton.addEventListener('click', this.fetchSource)
    } else {
      this.fetchSource()
    }
  }

  fetchSource() {
    const {
      loadTip,
    } = this.domRefs

    /* 获取音频资源 */
    this.fetchAudio()

    /* 隐藏加载资源按钮，显示正在加载提示 */
    loadTip.firstElementChild.style.display = 'none'
    loadTip.lastElementChild.style.display = 'block'
  }

  fetchAudio() {
    const audioElement = document.createElement('audio')

    this.handleAudioLoaded = this.handleAudioLoaded.bind(this)
    audioElement.addEventListener('canplay', this.handleAudioLoaded)
    audioElement.addEventListener('canplaythrough', this.handleAudioLoaded)
    audioElement.addEventListener('loadeddata', this.handleAudioLoaded)
    audioElement.addEventListener('loadedmetadata', this.handleAudioLoaded)

    audioElement.src = this.options.audioUrl

    this.domRefs.audio = audioElement

    this.state.audioLoadStatus = 'loading'
  }

  fetchImages() {
    const imageNameRegExp = /p(\d+)\.png$/

    /* 传入的图片链接可能是乱序的，将其按照p1.png，p2.png的顺序排序 */
    const imageUrls = this.options.imageUrls.sort((prev, next) => {
      const prevImageOrder = Number(prev.match(imageNameRegExp)[1])
      const nextImageOrder = Number(next.match(imageNameRegExp)[1])

      return prevImageOrder - nextImageOrder
    })
    this.options.imageUrls = imageUrls

    /* 图片宽度等于播放器宽度 */
    const imageWidth = this.domRefs.playerContainer.offsetWidth

    /* 生成图片节点,并请求第一张图片,待第一张请求成功再请求其他图片 */
    this.handleImageLoaded = this.handleImageLoaded.bind(this)
    this.domRefs.images = imageUrls.map(() => {
      const imageElement = new Image(imageWidth)
      imageElement.addEventListener('load', this.handleImageLoaded)
      return imageElement
    })

    /* 请求第一张图片 */
    this.handleFirstImageLoaded = this.handleFirstImageLoaded.bind(this)
    this.domRefs.images[0].addEventListener('load', this.handleFirstImageLoaded)
    this.domRefs.images[0].src = imageUrls[0]
  }

  handleFirstImageLoaded() {
    this.checkSrcLoadStatus()

    /* 加载剩余的图片 */
    this.domRefs.images.forEach((imageElem, index) => {
      if (index) {
        imageElem.src = this.options.imageUrls[index]
      }
    })
  }

  handleImageLoaded(e) {
    const imagePattern = /p(\d+)\.png$/
    const index = parseInt(e.target.src.match(imagePattern)[1], 10)
    this.state.isImagesLoaded[index] = true
  }

  handleAudioLoaded() {
    this.state.audioLoadStatus = 'finish'
    this.checkSrcLoadStatus()
  }

  checkSrcLoadStatus() {
    /* 如果音频加载完成且第一张图片加载完成，播放器可以开始播放 */
    if (this.state.audioLoadStatus === 'finish' && this.state.isImagesLoaded[0] && !this.state.canPlay) {
      this.state.canPlay = true

      /* 移除加载提示 */
      this.setLoadingTipStatus(false)

      /* 设置两个画布分别使用的缩放比例 */
      this.setPropotions()

      /* 图片和语音都已经加载完成，可以初始化页面的 HTML 结构了 */
      this.initHtml()
      this.bindEvents()

      /* 选择使用的画布 */
      this.setDrawTarget()

      /* 将播放进度调整到开头 */
      this.changeCurrentTime(0)

      if (this.options.autoPlay) {
        this.togglePlay()
      }

      this.showPlayerControl()
    }
  }

  initHtml() {
    this.renderCanvas()
    this.renderPlayerControl()
    this.renderCaptions()
    this.renderAudio()
    this.renderDraft()
  }

  /* 设置加载状态，并根据状态显示或隐藏加载提示 */
  setLoadingTipStatus(status) {
    this.state.isLoading = status
    this.domRefs.loading.style.display = this.state.isLoading ? 'block' : 'none'
  }

  renderImages() {
    const {
      images,
      imageContainer,
    } = this.domRefs

    /* 挂载图片节点，置于canvas之下 */
    this.domRefs.pages = []

    const fragment = document.createDocumentFragment()
    images.forEach((image) => {
      const section = document.createElement('section')
      section.classList.add('player-image-section')

      image.classList.add('player-image')
      section.appendChild(image)

      fragment.appendChild(section)
      this.domRefs.pages.push(section)
    })
    imageContainer.appendChild(fragment)
  }

  renderCanvas() {
    const canvas = document.createElement('canvas')
    this.domRefs.canvas = canvas

    const {
      imageContainer,
    } = this.domRefs

    this.setCanvasSize(imageContainer.offsetWidth)
    canvas.classList.add('player-canvas')

    imageContainer.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    this.state.contexts.push(ctx)
  }

  renderAudio() {
    const {
      audio,
      playerContainer,
    } = this.domRefs
    /* 将音频元素添加到文档中 */
    playerContainer.appendChild(audio)
  }

  renderPlayerControl() {
    const {
      domRefs: {
        playerContainer,
      },
      template: {
        playerControl: playerControlTemplate,
      },
    } = this

    const playerControl = Player.renderStringToNode(playerContainer, playerControlTemplate)

    /* 将控制条中点节点添加到domRefs中 */
    this.domRefs.playerControl = playerControl
    this.domRefs.progressbarWrapper = playerControl.querySelector('.player-progressbar-wrap')
    this.domRefs.playState = playerControl.querySelector('.player-play')
    this.domRefs.fullscreen = playerControl.querySelector('.player-fullscreen')
    this.domRefs.pageFullscreen = playerControl.querySelector('.player-page-fullscreen')
    this.domRefs.toggleCaptionsButton = playerControl.querySelector('.player-toggle-captions')
    this.domRefs.duration = playerControl.querySelector('.duration')
    this.domRefs.currentTime = playerControl.querySelector('.current-time')
    this.domRefs.progressbar = playerControl.querySelector('.player-progressbar')
    this.domRefs.preview = playerControl.querySelector('.player-preview')
    this.domRefs.progressHandle = playerControl.querySelector('.player-progressbar-handle')
  }

  renderCaptions() {
    const {
      playerContainer,
    } = this.domRefs
    const captionsNode = Player.renderStringToNode(playerContainer, this.template.captions)
    if (!this.state.isCaptionsOpen) {
      captionsNode.style.display = 'none'
    }
    this.domRefs.captions = captionsNode
  }

  renderDraft() {
    const draft = Player.renderStringToNode(this.domRefs.imageContainer, this.template.draft)

    const ctx = draft.getContext('2d')
    ctx.lineCap = 'round'
    this.state.contexts.push(ctx)

    this.domRefs.draft = draft

    this.setDraftSize()
  }

  bindEvents() {
    const {
      audio,
      fullscreen,
      pageFullscreen,
      playState,
      progressbarWrapper,
      playerControl,
      progressHandle,
      toggleCaptionsButton,
      captions,
      loadTip,
    } = this.domRefs

    this.handlePlayButtonClick = this.handlePlayButtonClick.bind(this)
    this.handleFullscreenClick = this.handleFullscreenClick.bind(this)
    this.handleCaptionsMove = this.handleCaptionsMove.bind(this)
    this.showPlayerControl = this.showPlayerControl.bind(this)
    this.handleCaptionsDown = this.handleCaptionsDown.bind(this)
    this.handleCaptionsUp = this.handleCaptionsUp.bind(this)
    this.handlePageFullscreenClick = this.handlePageFullscreenClick.bind(this)
    this.handleProgressbarOver = this.handleProgressbarOver.bind(this)
    this.handleProgressbarleave = this.handleProgressbarleave.bind(this)
    this.handleSeekMousedown = this.handleSeekMousedown.bind(this)
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this)
    this.handleEnded = this.handleEnded.bind(this)
    this.handleFullscreenChange = this.handleFullscreenChange.bind(this)
    this.handleCaptionButtonClick = this.handleCaptionButtonClick.bind(this)
    this.handleProgressbarClick = this.handleProgressbarClick.bind(this)
    this.handleRotateScreen = this.handleRotateScreen.bind(this)
    this.handleWindowResize = this.handleWindowResize.bind(this)

    /* 添加PC端事件 */
    if (this.options.mode === 'desktop') {
      playerControl.addEventListener('mouseenter', this.showPlayerControl)
      playerControl.addEventListener('mousemove', this.showPlayerControl)
      loadTip.addEventListener('mouseenter', this.showPlayerControl)
      loadTip.addEventListener('mousemove', this.showPlayerControl)
      loadTip.addEventListener('click', this.handlePlayButtonClick)
      pageFullscreen.addEventListener('click', this.handlePageFullscreenClick)
      progressbarWrapper.addEventListener('mouseover', this.handleProgressbarOver)
      progressbarWrapper.addEventListener('mouseleave', this.handleProgressbarleave)
      progressbarWrapper.addEventListener('mousemove', this.handleProgressbarOver)
      progressHandle.addEventListener('mousedown', this.handleSeekMousedown)
      captions.addEventListener('mousedown', this.handleCaptionsDown)
    }

    /* 添加公共事件 */
    audio.addEventListener('timeupdate', this.handleTimeUpdate)
    audio.addEventListener('ended', this.handleEnded)

    playState.addEventListener('click', this.handlePlayButtonClick)
    fscreen.addEventListener('fullscreenchange', this.handleFullscreenChange)
    fullscreen.addEventListener('click', this.handleFullscreenClick)
    toggleCaptionsButton.addEventListener('click', this.handleCaptionButtonClick)
    progressbarWrapper.addEventListener('click', this.handleProgressbarClick)
    window.addEventListener('orientationchange', this.handleRotateScreen)
    window.addEventListener('resize', this.handleWindowResize)

    /* 添加移动端事件 */
    if (this.options.mode === 'mobile') {
      this.handlePlayerTap = this.handlePlayerTap.bind(this)
      this.handleProgressPanStart = this.handleProgressPanStart.bind(this)
      this.handleProgressPanMove = this.handleProgressPanMove.bind(this)
      this.handleCaptionsPress = this.handleCaptionsPress.bind(this)
      this.handleCaptionsPressUp = this.handleCaptionsPressUp.bind(this)
      this.handleCaptionsPanMove = this.handleCaptionsPanMove.bind(this)
      this.handlePlayerDoubleTap = this.handlePlayerDoubleTap.bind(this)

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

      const loadTipHammer = new Hammer.Manager(loadTip, {
        recognizers: [
          [Hammer.Pan],
        ],
      })
      loadTipHammer.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }))
      loadTipHammer.add(new Hammer.Tap({ event: 'singletap' }))
      loadTipHammer.get('doubletap').recognizeWith('singletap')
      loadTipHammer.get('singletap').requireFailure('doubletap')
      loadTipHammer.on('singletap', this.handlePlayerTap)
      loadTipHammer.on('doubletap', this.handlePlayerDoubleTap)
      loadTipHammer.on('panstart', this.handleProgressPanStart)
      loadTipHammer.on('panleft panright', this.handleProgressPanMove)

      this.state.hammers = {
        handleHammer,
        captionsHammer,
        loadTipHammer,
      }
    }
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
      domRefs: {
        progressbarWrapper,
      },
      options: {
        duration,
      },
    } = this

    const percent = e.deltaX / progressbarWrapper.offsetWidth
    const deltaTime = duration * percent
    let time = this.panStartTime + deltaTime
    time = Math.min(duration, time)
    time = Math.max(0, time)
    this.showPlayerControl()
    this.changeCurrentTime(time * 1000)
  }

  handlePlayerTap(e) {
    e.preventDefault()
    this.showPlayerControl()
  }

  handleCaptionsDown(e) {
    const {
      captions,
    } = this.domRefs
    document.addEventListener('mousemove', this.handleCaptionsMove)
    document.addEventListener('mouseup', this.handleCaptionsUp)
    this.captionsStartX = captions.offsetLeft
    this.captionsStartY = captions.offsetTop
    this.cursorStartX = e.clientX
    this.cursorStartY = e.clientY
  }

  handleCaptionsUp() {
    document.removeEventListener('mousemove', this.handleCaptionsMove)
    document.removeEventListener('mouseup', this.handleCaptionsUp)
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
      playerContainer,
      playerControl,
    } = this.domRefs
    const parentWidth = playerContainer.offsetWidth
    const parentHeight = playerContainer.offsetHeight
    const captionsLeftMax = parentWidth - captions.offsetWidth
    const captionsBottomMax = parentHeight - captions.offsetHeight

    let leftOffset = left
    leftOffset = Math.max(0, leftOffset)
    leftOffset = Math.min(captionsLeftMax, leftOffset)
    captions.style.left = `${leftOffset / parentWidth * 100}%`

    /* 这里设置字幕的bottom值而非top，是考虑到用户一般会将字幕放到视频的下半部分，
    所以需要避免字幕过多时超出播放器的下限，但仍然有超出上限的危险 */
    let bottomOffset = parentHeight - top - captions.offsetHeight
    bottomOffset = Math.max(playerControl.offsetHeight, bottomOffset)
    bottomOffset = Math.min(captionsBottomMax, bottomOffset)
    captions.style.bottom = `${bottomOffset / parentHeight * 100}%`
  }

  handleWindowResize() {
    const {
      playerContainer,
    } = this.domRefs
    const currentWidth = playerContainer.offsetWidth
    /* 如果播放器节点的宽度没有改变，则无需重设播放器宽度 */
    if (!this.lastWidth || this.lastWidth !== currentWidth) {
      this.resizePlayer(playerContainer.offsetWidth)
    }
    this.lastWidth = currentWidth
  }

  handleEnded() {
    /* 将播放器暂停 */
    this.togglePlay()
    /* 恢复初始状态 */
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

  /* 根据全屏时屏幕尺寸计算播放器需放大到的尺寸 */
  getFullscreenSize() {
    /* 重设播放器的高宽，使之撑满屏幕 */
    const {
      height,
      width,
    } = window.screen

    const {
      windowHeight,
      windowWidth,
    } = this.actionData

    const propotion1 = height / width
    const propotion2 = windowHeight / windowWidth
    let containerHeight
    let containerWidth
    /* 如果宽度撑满，高度会超出屏幕，则选择撑满高度 */
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
    /* 若旋转了屏幕且此时处于全屏状态，需变更播放器尺寸 */
    if (fscreen.fullscreenElement) {
      const width = this.getFullscreenSize()
      this.domRefs.playerContainer.style.width = `${width}px`
      this.resizePlayer(width)
    }
  }

  handleFullscreenChange() {
    const {
      domRefs: {
        fullscreen,
        pageFullscreen,
        playerContainer,
      },
      options: {
        mode,
      },
      state: {
        initialWidth,
        isPageFullscreenOpen,
      },
    } = this

    if (fscreen.fullscreenElement) {
      const fullscreenSize = this.getFullscreenSize()
      playerContainer.style.width = `${fullscreenSize}px`
      this.resizePlayer(fullscreenSize)

      fullscreen.title = '退出全屏'

      /* 在全屏状态不可直接设置网页全屏，需先退出才可设置 */
      if (mode === 'desktop') {
        pageFullscreen.style.display = 'none'
      }
    } else {
      playerContainer.style.width = isPageFullscreenOpen ? '100%' : `${initialWidth}px`
      this.resizePlayer(playerContainer.offsetWidth)

      fullscreen.title = '进入全屏'
      if (mode === 'desktop') {
        pageFullscreen.style.display = 'inline'
      }
    }
  }

  setPropotions() {
    const {
      windowWidth,
      draftHeight,
    } = this.actionData
    const {
      imageContainer,
    } = this.domRefs
    const {
      propotions,
    } = this.state

    /* 课件画布同录制时的比例，该画布的宽度等于容器宽度 */
    propotions[0] = imageContainer.offsetWidth / windowWidth

    /* 草稿纸画布同录制时的比例，该画布的高度等于容器高度 */
    propotions[1] = imageContainer.offsetHeight / draftHeight
  }

  /* 根据mountNode的宽度设置播放器各部件大小 */
  resizePlayer(containerWidth) {
    const {
      audio,
      playerControl,
      captions,
    } = this.domRefs
    const {
      windowWidth,
      windowHeight,
    } = this.actionData

    const containerHeight = windowHeight / windowWidth * containerWidth

    /* 如果全屏，播放器控制条占满宽度 */
    let translateX = 0
    let controlWidth = containerWidth
    if (fscreen.fullscreenElement) {
      controlWidth = window.screen.width
      translateX = (window.screen.width - containerWidth) / 2
    }
    playerControl.style.width = `${controlWidth}px`

    /* 全屏时将控制条移到最左侧 */
    playerControl.style.transform = `translateX(${-translateX}px)`
    this.setContainerSize(containerWidth, containerHeight)
    this.setCanvasSize(containerWidth)

    /* 修改播放器size后与原始大小的比例发生了变化 */
    this.setPropotions()
    this.setDrawTarget()
    this.setDraftSize()
    this.changeCurrentTime(audio.currentTime * 1000)

    /* 调整字幕字体大小 */
    const propotion = containerWidth / this.state.initialWidth
    captions.style.fontSize = `${this.options.captionFontSize * propotion}px`
  }

  handleFullscreenClick() {
    const {
      playerContainer,
    } = this.domRefs
    if (fscreen.fullscreenElement) {
      fscreen.exitFullscreen()
    } else {
      fscreen.requestFullscreen(playerContainer)
    }
  }

  handlePageFullscreenClick() {
    const {
      playerContainer,
      pageFullscreen,
    } = this.domRefs
    this.state.isPageFullscreenOpen = !this.state.isPageFullscreenOpen
    if (this.state.isPageFullscreenOpen) {
      /* 改变图标 */
      pageFullscreen.firstElementChild.style.display = 'none'
      pageFullscreen.lastElementChild.style.display = 'inline-block'

      /* 网页全屏的含义是将播放器宽度设成100%，使其撑满包裹元素 */
      playerContainer.style.width = '100%'
      this.resizePlayer(playerContainer.offsetWidth)
    } else {
      pageFullscreen.firstElementChild.style.display = 'inline-block'
      pageFullscreen.lastElementChild.style.display = 'none'

      /* 退出网页全屏即将宽度恢复原值 */
      playerContainer.style.width = `${this.state.initialWidth}px`
      this.resizePlayer(playerContainer.offsetWidth)
    }
  }

  handleCaptionButtonClick() {
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
      playerContainer,
    } = this.domRefs
    canvas.width = width
    const height = images.reduce((max, cur) => Math.max(max, cur.offsetHeight), 0)
    canvas.height = Math.max(height, playerContainer.offsetHeight)
  }

  /* 根据此时播放器的大小设置草稿纸的尺寸，注意setPropotions函数需在此之前调用 */
  setDraftSize() {
    const {
      draft,
      imageContainer,
    } = this.domRefs
    const {
      draftWidth,
    } = this.actionData
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
    this.changeDisplaySubtitle(time)
  }

  rerenderTimeInfo() {
    const {
      domRefs: {
        audio,
        currentTime,
        duration: durationEl,
        progressbar,
      },
      options: {
        duration,
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
      options: {
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
    const {
      hidePlayerControl,
    } = this.state
    if (hidePlayerControl) {
      window.clearTimeout(hidePlayerControl)
    }
    playerControl.classList.remove('fade-out')
    playerControl.style.opacity = '1'
    this.state.hidePlayerControl = window.setTimeout(this.fadeOutPlayerControl.bind(this), 3000)
  }

  fadeOutPlayerControl() {
    if (!(this.state.isHalted)) {
      this.domRefs.playerControl.classList.add('fade-out')
    }
  }
  /* 获得鼠标放置位置的时间 */
  getCursorTime(e) {
    const wrapper = document.querySelector('.player-progressbar-wrap')
    let dist = e.clientX - wrapper.getBoundingClientRect().left
    dist = Math.max(0, dist)
    let percent = dist / wrapper.clientWidth
    percent = Math.min(percent, 1.0)
    const time = this.options.duration * percent * 1000
    return time
  }

  handlePlayButtonClick(e) {
    e.preventDefault()
    e.stopPropagation()
    this.togglePlay()
  }

  handlePlayerDoubleTap() {
    this.togglePlay()
  }

  togglePlay() {
    const {
      playState,
    } = this.domRefs
    this[this.state.isHalted ? 'play' : 'halt']()
    this.state.isHalted = !(this.state.isHalted)
    playState.title = this.state.isHalted ? '播放' : '暂停'
    playState.firstElementChild.className = this.state.isHalted ? 'fa fa-play' : 'fa fa-pause'
    this.showPlayerControl()
  }

  /* 用于正在缓冲时暂停播放,此函数不改变状态变量 */
  wait() {
    this.setLoadingTipStatus(true)
    this.halt()
  }

  halt() {
    this.domRefs.audio.pause()
    window.clearTimeout(this.state.nextAction)
    window.cancelAnimationFrame(this.state.animation)
  }

  /* 用于缓冲结束时继续播放 */
  continue() {
    this.setLoadingTipStatus(false)
    if (!this.state.isHalted) {
      this.domRefs.audio.play()
    }
  }

  play() {
    this.domRefs.audio.play()
    this.registerNextAction()
    this.registerNextAnimation()
  }

  waitPageLoading(waitingPage, waitingTime) {
    /* 等待加载的过程中暂停播放 */
    this.wait()

    /* 记录等待的页码和时间 */
    this.state.waiting = { waitingPage, waitingTime }

    /* 侦听等待图片的load事件，使得加载完成后可自动恢复播放 */
    this.domRefs.images[waitingPage].addEventListener('load', () => {
      const { waiting, isLoading } = this.state
      const { waitingPage: currentWaitingPage, waitingTime: currentWaitingTime } = waiting

      /* 如果当前正在加载，且当前等待的页码和时间与之前一致，则恢复播放，
      之所以要进行后面两个判断，是因为可能在等待加载的过程中又调整了进度，这时等待的页码和时间可能与之前不同 */
      if (isLoading && currentWaitingPage === waitingPage && waitingTime === currentWaitingTime) {
        /* 在此函数内只需根据情况打开音频，因为changeCurrentTime会注册板书动作 */
        this.continue()

        /* 由于等待的页码已经加载成功，此时可以顺利地调整时间 */
        this.changeCurrentTime(waitingTime)
      }
    })
  }

  /* 移动进度条时调用的函数，time单位为ms */
  changeCurrentTime(time) {
    const {
      domRefs: {
        audio,
      },
      state: {
        isImagesLoaded,
      },
    } = this
    /* 调整音频时间秒 */
    audio.currentTime = time / 1000
    this.rerenderTimeInfo()

    /* 若该时刻的图片还未加载完成，待加载完成再进行动作 */
    const page = this.getPageByTime(time)
    if (!isImagesLoaded[page]) {
      this.waitPageLoading(page, time)
      return
    }

    if (this.state.isLoading) {
      this.continue()
    }

    /* 取消已注册的动作 */
    window.clearTimeout(this.state.nextAction)
    /* 取消当前动画 */
    window.cancelAnimationFrame(this.state.animation)
    this.state.animationObj = null
    /* 转到time时刻所在的页面 */
    this.pageTo(page)
    /* 恢复课件在time时刻的状态 */
    this.setPageState(page, time)
    /* 恢复草稿纸在time时刻的状态 */
    this.setDraftState(time)
    /* 设置下一个要注册的动作 */
    const next = this.getNextAction(time)
    if (next) {
      this.state.nextActionIndex = next.actionId
    } else {
      this.state.nextActionIndex = -1
    }
    if (!(this.state.isHalted)) {
      this.registerNextAction()
      this.registerNextAnimation()
    }
    /* 重新渲染播放器控制条 */
    this.changeDisplaySubtitle(time)
  }

  registerNextAction() {
    const {
      actionData: {
        actions,
      },
      domRefs: {
        audio,
      },
      state: {
        nextActionIndex,
      },
    } = this
    if (nextActionIndex >= actions.length || nextActionIndex < 0) {
      return
    }
    this.state.nextAction = window.setTimeout(() => {
      this.handleNextAction(true)
    }, actions[nextActionIndex].startTime - audio.currentTime * 1000)
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
      actionData: {
        actions,
      },
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
    /* 注册下一个动作 */
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
        /* 计算有多少点出现在time时刻前，将这些点直接绘出，其余点需通过动画 */
        let cnt = Math.floor((time - startTime) / duration * length)
        cnt = Math.min(cnt, length)
        ctx.strokeStyle = action.color
        ctx.lineWidth = Math.max(propotion * action.width, 1.5)
        /* 记录笔迹动画开始前的canvas数据，动画的每一帧都要恢复一次 */
        this.backgroundData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        this.drawPoints(points, cnt)
        if (cnt >= length) {
          /* 所有的点都在time时刻前出现，无需注册动画 */
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
  /* 绘制points[0-end) */
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
    /* 起始点 */
    const x1 = points[0][0] * propotion
    const y1 = points[0][1] * propotion
    /* 结束点 */
    const x2 = points[1][0] * propotion
    const y2 = points[1][1] * propotion
    /* 箭杆长度 */
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
  /* 清除一些线 */
  eliminate(action) {
    if (this.state.isdraftOpen) {
      this.setDraftState(action.startTime + 1)
    } else {
      const currentPage = this.getPageByTime(action.startTime)
      this.setPageState(currentPage, action.startTime + 1)
    }
  }
  /* 撤销当前页的上一个绘制操作 */
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
    /* 移动图片和canvas */
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

    if (!this.state.isImagesLoaded[targetPage]) {
      this.waitPageLoading(targetPage, action.startTime - 1)
      return
    }

    /* 转到该页 */
    this.pageTo(targetPage, animate)
    this.setPageState(targetPage, action.startTime)
  }

  setPageState(page, time) {
    const {
      images,
    } = this.domRefs
    /* 关闭草稿纸，将笔迹绘制在课件上 */
    this.state.isdraftOpen = false
    this.setDrawTarget()
    const {
      ctx,
    } = this.state
    const {
      canvas,
    } = ctx
    /* 重做该页之前发生过的所有动作 */
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    /* 因为之后要重做在page页上发生的动作（包括滚动），所以这里将该页的图片和canvas的垂直偏移置为0 */
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
      actionData: {
        actions,
      },
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
      actionData: {
        actions,
      },
    } = this
    const res = []
    let isdraftOpen = false
    for (let i = 0; i < actions.length && time > actions[i].startTime; ++i) {
      const action = actions[i]
      if (action.type === 'draft') {
        isdraftOpen = (action.status === 'open')
      } else if (isdraftOpen) {
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
      actionData: {
        actions,
      },
    } = this
    let page = 0
    for (let i = 0; i < actions.length && actions[i].startTime < time; ++i) {
      if (actions[i].type === 'page') {
        page += actions[i].direction === 'prev' ? -1 : 1
      }
    }
    return page
  }
  /* 获得time时刻前在page上进行过的所有未被撤销、未被清除的移动和绘制操作 */
  getDrawActionsOnPage(page, time) {
    return Player.filterActions(this.getActionsOnPage(page, time))
  }
  /* 根据撤销和消除操作对actions进行过滤 */
  static filterActions(actions) {
    /* 需要收集的动作类型 */
    const includeTypes = ['arrow', 'scroll', 'path', 'clear', 'eliminate']
    /* 可以被撤销的动作类型 */
    const withdrawTypes = ['arrow', 'path', 'clear', 'eliminate']
    const res = []
    let eliminatedIds = []
    for (let i = 0; i < actions.length; ++i) {
      const action = actions[i]
      /* 只收集进行的移动和绘制操作 */
      if (includeTypes.indexOf(action.type) !== -1) {
        /* 判断这个操作是否被之后的撤销操作撤销了 */
        let withdraw = false
        if (withdrawTypes.indexOf(action.type) !== -1) {
          /* 若cnt变为0，则说明这个动作被撤销了 */
          let cnt = 1
          /* 这里加入了对page类型的判断，因为如果翻页之后再翻回来，之前的操作便不可撤销了 */
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
  /* time时刻在page上进行的动作 */
  getActionsOnPage(page, time) {
    const {
      actionData: {
        actions,
      },
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
  /* 返回time时刻的下一个动作 */
  getNextAction(time) {
    const {
      actionData: {
        actions,
      },
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

  /* 将秒表示的时间转换为00:00:00格式 */
  static normalizeTime(time) {
    /* 精确到s */
    time = Math.floor(time)
    const hours = Math.floor(time / 3600)
    const remain = time % 3600
    const minutes = Math.floor(remain / 60)
    const seconds = remain % 60
    let res = ''
    /* 如果短于1h，不要小时段 */
    res += hours ? `${hours}:` : ''
    /* 如果前面有小时段，分钟至少为两位数 */
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

  changeDisplaySubtitle(currentTime) {
    const {
      subtitles,
      isCaptionsOpen,
      currentSubtitleIndex,
    } = this.state
    const {
      playerContainer,
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
      bubbles: true,
      detail: {
        hasSubtitle,
        subtitleIndex: res,
      },
    })
    playerContainer.dispatchEvent(event)
    this.state.currentSubtitleIndex = res
  }

  /* 渲染 string 表示的 HTML 元素并将之插入到第一个参数所指向的元素中，之后返回该元素 */
  static renderStringToNode(parent, string) {
    const elem = document.createElement('div')
    elem.innerHTML = string
    /* 注意调用appenChild会将之从原来的parent节点remove掉,并附加在新parent的最后 */
    parent.appendChild(elem.firstElementChild)
    return parent.lastElementChild
  }

  updateSubtitles(subtitles) {
    this.state.subtitles = subtitles
  }

  unmount() {
    const {
      playerContainer,
      audio,
      fullscreen,
      pageFullscreen,
      playState,
      progressbarWrapper,
      playerControl,
      progressHandle,
      toggleCaptionsButton,
      captions,
      loadTip,
      images,
    } = this.domRefs
    const {
      nextAction,
      animation,
      hidePlayerControl,
    } = this.state

    /* 将播放器从dom树中移除 */
    while (playerContainer.firstChild) {
      playerContainer.removeChild(playerContainer.firstChild)
    }

    /* 移除PC端事件 */
    if (this.options.mode === 'desktop') {
      playerControl.removeEventListener('mouseenter', this.showPlayerControl)
      playerControl.removeEventListener('mousemove', this.showPlayerControl)
      loadTip.removeEventListener('mouseenter', this.showPlayerControl)
      loadTip.removeEventListener('mousemove', this.showPlayerControl)
      loadTip.removeEventListener('click', this.handlePlayButtonClick)
      pageFullscreen.removeEventListener('click', this.handlePageFullscreenClick)
      progressbarWrapper.removeEventListener('mouseover', this.handleProgressbarOver)
      progressbarWrapper.removeEventListener('mouseleave', this.handleProgressbarleave)
      progressbarWrapper.removeEventListener('mousemove', this.handleProgressbarOver)
      progressHandle.removeEventListener('mousedown', this.handleSeekMousedown)
      captions.removeEventListener('mousedown', this.handleCaptionsDown)
    }

    /* 移除公共事件 */
    audio.removeEventListener('timeupdate', this.handleTimeUpdate)
    audio.removeEventListener('ended', this.handleEnded)
    audio.removeEventListener('canplay', this.handleAudioLoaded)
    audio.removeEventListener('canplaythrough', this.handleAudioLoaded)
    audio.removeEventListener('loadeddata', this.handleAudioLoaded)
    audio.removeEventListener('loadedmetadata', this.handleAudioLoaded)

    playState.removeEventListener('click', this.handlePlayButtonClick)
    fullscreen.removeEventListener('click', this.handleFullscreenClick)
    fscreen.removeEventListener('fullscreenchange', this.handleFullscreenChange)
    toggleCaptionsButton.removeEventListener('click', this.handleCaptionButtonClick)
    progressbarWrapper.removeEventListener('click', this.handleProgressbarClick)
    window.removeEventListener('orientationchange', this.handleRotateScreen)
    window.removeEventListener('resize', this.handleWindowResize)

    images[0].removeEventListener('load', this.handleFirstImageLoaded)

    if (this.options.mode === 'mobile') {
      // 移除移动端事件
      const {
        handleHammer,
        captionsHammer,
        loadTipHammer,
      } = this.state.hammers

      handleHammer.destroy()
      captionsHammer.destroy()
      loadTipHammer.destroy()

      if (this.options.mode === 'mobile') {
        const loadButton = loadTip.querySelector('.player-load-button')
        loadButton.removeEventListener('click', this.fetchSource)
      }
    }

    /* 清除使用setTimeout, requestAnimation注册的操作 */
    /* 无需判断clearTimeout的参数是否为null，因为即使传入错误的值也不会抛出异常 */
    window.clearTimeout(hidePlayerControl)
    window.clearTimeout(nextAction)
    if (animation) {
      window.cancelAnimationFrame(animation)
    }
  }
}
