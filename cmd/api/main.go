package main

import (
	"flag"
	"log"
	"os"
	"path/filepath"

	"tts/internal/http/server"
)

func main() {
	// 解析命令行参数
	configPath := flag.String("config", "", "配置文件路径")
	flag.Parse()

	// 如果没有指定配置文件，尝试默认位置
	if *configPath == "" {
		// 尝试多个位置查找配置文件
		possiblePaths := []string{
			"./configs/config.yaml",
			"../configs/config.yaml",
			"/etc/tts/config.yaml",
		}

		for _, path := range possiblePaths {
			if _, err := os.Stat(path); err == nil {
				*configPath = path
				break
			}
		}

		// 如果还是没找到，使用默认位置
		if *configPath == "" {
			*configPath = "./configs/config.yaml"
		}
	}

	// 确保配置文件路径是绝对路径
	absConfigPath, err := filepath.Abs(*configPath)
	if err != nil {
		log.Fatalf("无法获取配置文件的绝对路径: %v", err)
	}

	// 打印使用的配置文件路径
	log.Printf("使用配置文件: %s", absConfigPath)

	// 创建并启动应用
	app, err := server.NewApp(absConfigPath)
	if err != nil {
		log.Fatalf("初始化应用失败: %v", err)
	}

	// 启动应用并处理错误
	if err := app.Start(); err != nil {
		log.Fatalf("应用运行出错: %v", err)
	}
}
