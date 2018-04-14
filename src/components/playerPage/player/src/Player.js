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
      animationObj: null,
      // 播放器处于暂停或播放状态
      halt: true,
      // 是否处于网页全屏
      pageFullscreen:false,
      // 音频时长 s
      duration: 0,
      // 播放器将挂载在移动端或者桌面端
      mode: source.mode||'desktop',
      // 草稿纸是否处于打开状态
      draftOpen:false,
      // 当前使用的草稿纸编号，从1开始
      draftNum:1,
      // 保存所有canvas的context，一个是在课件上绘制笔迹的canvas，其余为草稿纸canvas
      contexts:[],
      // 保存课件canvas和草稿纸canvas使用的比例
      propotions:[],
      // 当前使用的比例
      propotion:1,
      // 当前使用的context
      ctx:null,
      playingSubtitleIndex:0
    }
    // html模板
    this.template = {
      playerControl: `<div class="player-main">
        <div class="player-section-left">
          <div class="player-section player-play player-button">
            <i class="fa fa-play" title="播放"></i>
          </div>
          <div class="player-section player-time">
            <span class="current-time">%{currentTime}%</span>
            <span class="player-time-divider">/</span>
            <span class="duration">%{duration}%</span>
          </div>
        </div>
        <div class="player-section-right">
          <div class="player-section player-button player-page-fullscreen">
            <i class="fa fa-angle-double-up" title="网页全屏"></i>
          </div>
          <div class="player-section player-button player-fullscreen">
            <i class="fa fa-expand" title="进入全屏"></i>
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
      </div>`,
      draft: `<canvas class="draft"></canvas>`
    }
    // 播放器的初始宽度，用于退出全屏时进行恢复
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
      this.setDrawTarget()
      /* 去除正在加载的提示 */
      const shade = this.domRefs.shade
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
    /* 在 canvas 元素添加到文档中以后，再将遮罩元素添加到文档中，作为开始按钮 */
    const template = document.createElement('template')
    template.innerHTML = this.template.mask
    /* 将遮罩元素也添加到 domRefs 中 */
    this.domRefs.mask = template.content.firstChild
    imageContainer.appendChild(this.domRefs.mask)
    const ctx= canvas.getContext('2d')
    ctx.lineCap = 'round'
    this.state.contexts.push(ctx)
    this.setPropotions()
  }

  renderAudio() {
    const {
      audio,
      mountNode
    } = this.domRefs
    /* 将音频元素添加到文档中 */
    mountNode.appendChild(audio)
  }

  renderPlayerControl() {
    const {
      mountNode,
      audio
    } = this.domRefs
    const {
      duration,
      mode
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
    this.domRefs.pageFullscreen= content.querySelector('.player-page-fullscreen').firstElementChild
    this.domRefs.duration = content.querySelector('.duration')
    this.domRefs.currentTime = content.querySelector('.current-time')
    this.domRefs.progressbar = content.querySelector('.player-progressbar')
    this.domRefs.preview = content.querySelector('.player-preview')
    this.domRefs.progressHandle = content.querySelector('.player-progressbar-handle')
    if(this.mode=='mobile'){
      this.domRefs.pageFullscreen.style.display='none'
    }
    mountNode.appendChild(this.domRefs.playerControl)
  }

  renderDraft(){
    const {imageContainer}=this.domRefs
    const template=document.createElement('template')
    template.innerHTML=this.template.draft
    const draft=this.domRefs.draft=template.content.querySelector('.draft')
    const ctx=draft.getContext('2d')
    ctx.lineCap='round'
    this.state.contexts.push(ctx)
    imageContainer.appendChild(draft)
  }

  bindEvents() {
    const {
      audio,
      canvas,
      fullscreen,
      pageFullscreen,
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
    if(this.state.mode=='desktop'){
      pageFullscreen.addEventListener('click',this.togglePageFullscreen.bind(this))
    }
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
      } = screen
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
      pageFullscreen,
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
      fullscreen.title='退出全屏'
      if(this.state.mode=='desktop'){
        pageFullscreen.style.display='none'
      }
    } else {
      document.removeEventListener('click', this.handleFullscreenClick)
      canvas.addEventListener('click', this.togglePlay)
      mountNode.style.width=this.initialWidth
      this.resizePlayer(this.playerSize)
      fullscreen.className = 'fa fa-expand'
      fullscreen.title='进入全屏'
      if(this.state.mode=='desktop'){
        pageFullscreen.style.display='inline'
      }
    }
  }

  setPropotions(){
    const {windowWidth,draftHeight}=this.source.actionData
    const {imageContainer}=this.domRefs
    const {propotions}=this.state
    propotions[0]=imageContainer.offsetWidth/windowWidth
    propotions[1]=imageContainer.offsetHeight/draftHeight
  }

  // 根据mountNode的宽度设置播放器各部件大小
  resizePlayer(containerWidth) {
    const {
      audio,
      mountNode,
      playerControl,
      draft
    } = this.domRefs
    const {
      windowWidth,
      windowHeight
    } = this.source.actionData
    const containerHeight = windowHeight / windowWidth * containerWidth
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
    if(this.state.draftOpen){
      draft.style.transition=''
      this.setDraftSize()
    }
    // 修改播放器size后与原始大小的比例发生了变化
    this.setPropotions()
    this.setDrawTarget()
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

  togglePageFullscreen(){
    const {mountNode,pageFullscreen}=this.domRefs
    this.state.pageFullscreen=!this.state.pageFullscreen
    if(this.state.pageFullscreen){
      pageFullscreen.className="fa fa-angle-double-up"
      mountNode.style.width='100%'
      this.resizePlayer(mountNode.offsetWidth)
    } else {
      pageFullscreen.className="fa fa-angle-double-down"
      mountNode.style.width='494px'
      this.resizePlayer(mountNode.offsetWidth)
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
  setCanvasSize(width) {
    const {
      images,
      canvas,
      draft
    } = this.domRefs
    canvas.width = width
    canvas.height= images.reduce((max, cur) => Math.max(max, cur.offsetHeight), 0)
  }

  setDraftSize(){
    const {draft,imageContainer}=this.domRefs
    const {draftWidth}=this.source.actionData
    const {propotions}=this.state
    const height=imageContainer.offsetHeight
    const width=draftWidth*propotions[1]
    draft.width=width
    draft.height=height
    draft.style.width=`${width}px`
    draft.style.height=`${height}px`
  }

  handleTimeUpdate(e) {
    const {mountNode}=this.domRefs
    const {subtitles}=this.source
    this.rerenderTimeInfo()
    const time = e.target.currentTime * 1000
    this.updateSubtitles(subtitles,time)
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
    playState.title=this.state.halt?'播放':'暂停'
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
    this.updateSubtitles(this.source.subtitles,time)
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
        duration,
      } = this.state.animationObj
      this.drawPoint(points, next, duration)
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
      case 'draft':
        this.draft(nextAction)
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
      propotion
    } = this.state
    const canvas=ctx.canvas
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
          }
        } = this
        const duration = endTime - startTime
        const {length}=points
        // 计算有多少点出现在time时刻前，将这些点直接绘出，其余点需通过动画
        let cnt = Math.floor((time - startTime) /duration*length)
        // 记录笔迹动画开始前的canvas数据，动画的每一帧都要恢复一次
        this.backgroundData=ctx.getImageData(0,0,canvas.width,canvas.height)
        ctx.strokeStyle=action.color
        ctx.lineWidth=propotion*action.width
        this.drawPoints(points, cnt)
        if (cnt >= length) {
          // 所有的点都在time时刻前出现，无需注册动画
          this.state.animationObj = null
        } else {
          const animationDuration=duration*((length-cnt)/length)
          const {delay,step}=this.getAnimationDelay(length-cnt,animationDuration)
          this.state.animationObj = {
            points,
            next: Math.min(length-1,cnt+step-1),
            duration:animationDuration-delay
          }
        }
      } else {
        this.state.nextActionIndex = action.actionId
        this.handleNextAction(false)
      }
    })
    this.state.nextActionIndex = nextActionIndex
  }

  getAnimationDelay(n,duration){
    let delay = duration / n
    let step=1
    let gap=20
    if(delay<gap){
      step=Math.ceil(gap/delay)
      delay=gap
    }
    return {step,delay}
  }

  // 绘制points[0-end)
  drawPoints(points, end) {
    const {
      ctx,
      propotion
    } = this.state
    ctx.beginPath()
    points.slice(0, end).forEach((point, i) => {
      const x = point[0] * propotion,
        y = point[1] * propotion
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
      options: {
        pen
      },
    } = this
    const {ctx,propotion} =this.state
    if (!points.length) {
      return
    }
    ctx.lineWidth = width || pen.width
    ctx.lineWidth*=propotion
    ctx.strokeStyle = color || pen.color
    // 无动画绘制路径
    if (!animate) {
      this.drawPoints(points, points.length - 1)
    } else {
      // 有动画绘制路径
      const duration=endTime-startTime
      const {delay,step}=this.getAnimationDelay(points.length,duration)
      /* 保存在绘制路径前canvas的数据 */
      this.backgroundData=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height)
      this.drawPoint(points, Math.min(points.length-1,step-1), duration-delay)
    }
  }

  /* duration是这个动画过程还剩下的时间，每过一帧都会减少 */
  drawPoint(points, i, duration) {
    if (i < 0 || i >= points.length) {
      return
    }
    const {
      ctx,
      propotion
    } = this.state
    /* 清空画布，再重绘背景 */
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
    ctx.putImageData(this.backgroundData,0,0)
    ctx.beginPath()
    for(let k=0;k<=i;++k){
      const point=points[k]
      const x= point[0]*propotion
      const y=point[1]*propotion
      if(k===0){
        ctx.moveTo(x,y)
      } else {
        ctx.lineTo(x,y)
      }
    }
    ctx.stroke()
    if (i < points.length - 1) {
      /* 在每一帧重新计算动画的延迟和步数 */
      const {delay,step}=this.getAnimationDelay(points.length-1-i,duration)
      const next=Math.min(i + step,points.length-1)
      this.state.animation = window.setTimeout(() => {
        this.drawPoint(points, next, duration-delay)
      }, delay)
      this.state.animationObj = {
        points,
        next,
        duration:duration-delay
      }
    } else {
      this.state.animation = null
      this.state.animationObj = null
    }
  }

  drawArrow(action) {
    const {
      propotion,ctx
    } = this.state
    const {
      points
    } = action
    ctx.lineWidth = action.width*propotion
    ctx.fillStyle = action.color
    // 起始点
    const x1 = points[0][0] * propotion,
      y1 = points[0][1] * propotion
    // 结束点
    const x2 = points[1][0] * propotion,
      y2 = points[1][1] * propotion
    // 箭杆长度
    const r=Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2))
    const aX=x2-(10*propotion*(y1-y2)/r)
    const aY=y2-(10*propotion*(x2-x1)/r)
    const bX=x2+(20*propotion*(x2-x1)/r)
    const bY=y2-(20*propotion*(y1-y2)/r)
    const cX=x2+(10*propotion*(y1-y2)/r)
    const cY=y2+(10*propotion*(x2-x1)/r)
    const dX=x2-(5*propotion*(y1-y2)/r)
    const dY=y2-(5*propotion*(x2-x1)/r)
    const eX=x2+(5*propotion*(y1-y2)/r)
    const eY=y2+(5*propotion*(x2-x1)/r)
    ctx.beginPath()
    ctx.moveTo(x1,y1)
    ctx.lineTo(dX,dY)
    ctx.lineTo(aX,aY)
    ctx.lineTo(bX,bY)
    ctx.lineTo(cX,cY)
    ctx.lineTo(eX,eY)
    ctx.fill()
  }

  clear() {
    const {ctx}=this.state
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  }

  // 清除一些线
  eliminate(action){
    const currentPage=this.getPageByTime(action.startTime)
    this.handlePageActions(currentPage,action.startTime+1)
  }

  // 撤销当前页的上一个绘制操作
  withdraw(action) {
    const currentPage = this.getPageByTime(action.startTime)
    this.handlePageActions(currentPage, action.startTime + 1)
  }

  draft(action){
    const {status}=action
    const {draft,imageContainer}=this.domRefs
    draft.style.transition='width 0.2s linear'
    if(status=='open'){
      this.setDraftSize()
      this.state.draftOpen=true
    } else {
      draft.style.width='0'
      draft.width=0
      this.state.draftOpen=false
    }
    /* 切换用于绘制的canvas，草稿纸或者课件 */
    this.setDrawTarget()
  }

  /* 根据草稿纸是否打开，切换当前使用的canvas及比例 */
  setDrawTarget(){
    const {draftOpen,draftNum,propotions,contexts}=this.state
    let ctxIndex=0
    let propIndex=0
    if(draftOpen){
      ctxIndex=draftNum
      propIndex=1
    }
    this.state.ctx=contexts[ctxIndex]
    this.state.propotion=propotions[propIndex]
  }

  scroll(action, animate) {
    const {
      images,
      canvas
    } = this.domRefs
    const {
      scrollDuration
    } = this.options
    const {propotion}=this.state
    const currentPage = this.getPageByTime(action.startTime)
    const image = images[currentPage]
    // 移动图片和canvas
    const offsetY = action.yDistance * propotion
    let orginOffset = 0
    let tmp = image.style.transform.match(/translateY\(-(.*)px\)/)
    if (tmp) {
      orginOffset = window.parseInt(tmp[1], 10)
    }
    const dist = Math.abs(orginOffset - offsetY)
    const duration = dist / image.offsetHeight * propotion * scrollDuration
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
      images
    } = this.domRefs
    const {ctx}=this.state
    const canvas=ctx.canvas
    // 重做该页之前发生过的所有动作
    ctx.clearRect(0, 0, canvas.width, canvas.height)
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
      return !action.id||eliminatedIds.indexOf(action.id)==-1
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
    actionData.draftWidth=window.parseInt(actionData.draftWidth,10)
    actionData.draftHeight=window.parseInt(actionData.draftHeight,10)
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

  updateSubtitles(subtitles,currentTime){
    const {mountNode} = this.domRefs
    let playingSubtitleIndex
    if (subtitles.length) {
      playingSubtitleIndex = this.state.playingSubtitleIndex
      let currentSubtitleStartTime = subtitles[playingSubtitleIndex].beginTime
      let prevSubtitleStartTime = playingSubtitleIndex > 0 ? subtitles[playingSubtitleIndex - 1].beginTime : undefined
      let nextSubtitleStartTime = playingSubtitleIndex + 1 < subtitles.length ? subtitles[playingSubtitleIndex + 1].beginTime : undefined
      if (currentTime > window.parseFloat(currentSubtitleStartTime)) {
        /* undefined == null true */
        while (nextSubtitleStartTime != undefined && currentTime > window.parseFloat(nextSubtitleStartTime)) {
          playingSubtitleIndex += 1
          nextSubtitleStartTime = playingSubtitleIndex + 1 < subtitles.length ? subtitles[playingSubtitleIndex + 1].beginTime : undefined
        }
      } else if (currentTime < window.parseFloat(currentSubtitleStartTime) && playingSubtitleIndex > 0) {
        /* undefined == null true */
        /* 这里使用 do-while 语句是因为，只要当前的播放进度比当前的字幕进度慢，那么当前的字幕就不应该显示，而是显示在此之前的字幕 */
        do {
          playingSubtitleIndex -= 1
          prevSubtitleStartTime = playingSubtitleIndex > 0 ? subtitles[playingSubtitleIndex - 1].beginTime : undefined
        } while (prevSubtitleStartTime != undefined && currentTime < window.parseFloat(prevSubtitleStartTime))
      }
      this.state.playingSubtitleIndex = playingSubtitleIndex
      const beginTime = subtitles[playingSubtitleIndex].beginTime
      const endTime = subtitles[playingSubtitleIndex].endTime
      if (currentTime > window.parseFloat(endTime) || currentTime < window.parseFloat(beginTime)) {
        playingSubtitleIndex = -1
      }
    } else {
      playingSubtitleIndex = -1
    }
    const event = new CustomEvent('subtitlechange', { detail: {subtitleIndex : playingSubtitleIndex} })
    mountNode.dispatchEvent(event)
  }
}
