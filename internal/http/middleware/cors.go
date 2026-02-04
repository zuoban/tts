package middleware

import (
	"net/url"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"tts/internal/config"
)

// CORS 处理跨域资源共享
func CORS(cfg *config.Config) gin.HandlerFunc {
	allowOrigins := []string{"*"}
	allowMethods := []string{"GET", "POST", "OPTIONS"}
	allowHeaders := []string{"Content-Type", "Authorization"}
	exposeHeaders := []string{}
	allowCredentials := false
	maxAge := 0

	if cfg != nil {
		if len(cfg.CORS.AllowOrigins) > 0 {
			allowOrigins = cfg.CORS.AllowOrigins
		}
		if len(cfg.CORS.AllowMethods) > 0 {
			allowMethods = cfg.CORS.AllowMethods
		}
		if len(cfg.CORS.AllowHeaders) > 0 {
			allowHeaders = cfg.CORS.AllowHeaders
		}
		if len(cfg.CORS.ExposeHeaders) > 0 {
			exposeHeaders = cfg.CORS.ExposeHeaders
		}
		if cfg.CORS.AllowCredentials {
			allowCredentials = true
		}
		if cfg.CORS.MaxAge > 0 {
			maxAge = cfg.CORS.MaxAge
		}
	}

	return func(c *gin.Context) {
		// 设置CORS响应头
		origin := c.Request.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}

		allowAll := containsString(allowOrigins, "*")
		if allowCredentials && allowAll {
			// credentials 模式下不能返回 "*"，必须回显具体 Origin
			allowAll = false
		}

		if allowAll {
			c.Header("Access-Control-Allow-Origin", "*")
		} else if origin != "" && matchesOrigin(allowOrigins, origin) {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		c.Header("Access-Control-Allow-Methods", strings.Join(allowMethods, ", "))
		c.Header("Access-Control-Allow-Headers", strings.Join(allowHeaders, ", "))
		if len(exposeHeaders) > 0 {
			c.Header("Access-Control-Expose-Headers", strings.Join(exposeHeaders, ", "))
		}
		if allowCredentials {
			c.Header("Access-Control-Allow-Credentials", "true")
		}
		if maxAge > 0 {
			c.Header("Access-Control-Max-Age", strconv.Itoa(maxAge))
		}

		// 如果是预检请求，直接返回200
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(200)
			return
		}

		// 继续下一个处理器
		c.Next()
	}
}

func containsString(list []string, target string) bool {
	for _, item := range list {
		if item == target {
			return true
		}
	}
	return false
}

func matchesOrigin(allowOrigins []string, origin string) bool {
	for _, allowed := range allowOrigins {
		if allowed == origin {
			return true
		}
		if matchOriginPattern(allowed, origin) {
			return true
		}
	}
	return false
}

func matchOriginPattern(allowed string, origin string) bool {
	allowed = strings.TrimSpace(allowed)
	origin = strings.TrimSpace(origin)
	if allowed == "" || origin == "" {
		return false
	}

	allowedURL, errAllowed := url.Parse(allowed)
	originURL, errOrigin := url.Parse(origin)

	// 如果 allowed 不是完整 URL，只处理为 host 模式
	if errAllowed != nil || allowedURL.Host == "" {
		return matchHostPattern(allowed, origin)
	}
	if errOrigin != nil || originURL.Host == "" {
		return false
	}

	if allowedURL.Scheme != "" && allowedURL.Scheme != originURL.Scheme {
		return false
	}

	return matchHostPattern(allowedURL.Host, originURL.Host)
}

func matchHostPattern(allowedHost string, originHost string) bool {
	allowedHost = normalizeHost(allowedHost)
	originHost = normalizeHost(originHost)

	if allowedHost == originHost {
		return true
	}

	if strings.HasPrefix(allowedHost, "*.") {
		base := strings.TrimPrefix(allowedHost, "*.")
		// 仅匹配子域名，不包含根域
		if originHost == base {
			return false
		}
		return strings.HasSuffix(originHost, "."+base)
	}

	return false
}

func normalizeHost(host string) string {
	parts := strings.Split(host, ":")
	return parts[0]
}
