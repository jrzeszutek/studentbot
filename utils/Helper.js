const _ = require('lodash')
const UrlMap = require('../config/map')

/**
 * @class Helper
 * Class responsible for doing little works like validation to help clear out main code
 */
class Helper {

	static getYear(year) {
		if (_.isString(year) && !_.isEmpty(year) && /\d{4}-\d{4}/.test(year)) {
			let reg = /\d{2}(\d{2})-\d{2}(\d{2})/
			let matches = reg.exec(year)
			
			if (matches[2] - matches[1] === 1) {
				// There has to be exactly ONE YEAR difference
				return year
			}
		}

		return null
	}

	static getPath(fac, deg) {
		if (_.isString(fac) && !_.isEmpty(fac) && _.isString(deg) && !_.isEmpty(deg)) {
			if (_.has(UrlMap.path, `${fac}/${deg}`)) {
				return UrlMap.path[`${fac}/${deg}`]
			}
		}

		return null
	}

}

module.exports = Helper
