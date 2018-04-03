import Mock,{Random} from 'mockjs'

export default Mock.mock({
	'subtitles': [{
		startTime:Random.range(1, 200000, 2000),
		textArr: Random.cparagraph( 30 )
	}]
})