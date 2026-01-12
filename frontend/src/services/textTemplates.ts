import type { TextTemplate, TemplatesState } from '../types/index';
import { STORAGE_KEYS } from '../types/index';

const DEFAULT_TEMPLATES_KEY = 'tts_default_templates_initialized';

const DEFAULT_TEMPLATES: Omit<TextTemplate, 'id' | 'createdAt'>[] = [
  {
    title: 'SSML 高级示例',
    content: `<prosody rate="slow" pitch="+10Hz">
    这是一段慢速且音调升高的文本。
    <break time="500ms"/>
    <emphasis level="strong">这部分会被强调</emphasis>
    <prosody volume="loud">
      这部分会更大声，同时保持慢速和音调升高。
    </prosody>
    <say-as interpret-as="cardinal">123</say-as>
    <p>这是嵌套在prosody中的段落。</p>
  </prosody>`,
    order: 0
  },
  {
    title: '问候语',
    content: '你好，欢迎使用 TTS Studio！这是一个文本转语音的在线工具。',
    order: 1
  },
  {
    title: '新闻播报',
    content: '欢迎收听今天的新闻。首先来看国内要闻，接下来是国际新闻，最后是天气预报。',
    order: 2
  },
  {
    title: '有声书朗读',
    content: '第一章：起源\n\n在那遥远的古代，有一个神秘的村庄。村民们过着平静而安宁的生活。',
    order: 3
  },
  {
    title: '通知公告',
    content: '各位用户请注意，系统将于今晚 23:00 至次日 01:00 进行维护，期间将无法访问。感谢您的理解与配合！',
    order: 4
  }
];

export class TextTemplatesService {
  static initializeDefaultTemplates(): void {
    try {
      const initialized = localStorage.getItem(DEFAULT_TEMPLATES_KEY);
      if (initialized) {
        return;
      }

      const existingTemplates = this.getTemplates();
      if (existingTemplates.length > 0) {
        localStorage.setItem(DEFAULT_TEMPLATES_KEY, 'true');
        return;
      }

      const defaultTemplates: TextTemplate[] = DEFAULT_TEMPLATES.map((template, index) => ({
        ...template,
        id: `default_template_${index}`,
        createdAt: new Date(),
        order: index
      }));

      this.saveTemplates(defaultTemplates);
      localStorage.setItem(DEFAULT_TEMPLATES_KEY, 'true');

      console.log('已初始化默认文本模板', defaultTemplates.length);
    } catch (error) {
      console.error('初始化默认文本模板失败:', error);
    }
  }

  static getTemplates(): TextTemplate[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TEXT_TEMPLATES);
      if (!stored) return [];

      const data: TemplatesState = JSON.parse(stored);
      return data.items.map((item, index) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        order: item.order ?? index
      }));
    } catch (error) {
      console.error('获取文本模板失败:', error);
      return [];
    }
  }

  static saveTemplates(items: TextTemplate[]): void {
    try {
      const data: TemplatesState = {
        items,
        lastUpdated: new Date()
      };
      localStorage.setItem(STORAGE_KEYS.TEXT_TEMPLATES, JSON.stringify(data));
    } catch (error) {
      console.error('保存文本模板失败:', error);
    }
  }

  static addTemplate(template: Omit<TextTemplate, 'id' | 'createdAt'>): TextTemplate {
    const templates = this.getTemplates();
    const newTemplate: TextTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      order: templates.length
    };

    templates.push(newTemplate);
    this.saveTemplates(templates);
    return newTemplate;
  }

  static updateTemplate(id: string, updates: Partial<TextTemplate>): boolean {
    try {
      const templates = this.getTemplates();
      const index = templates.findIndex(item => item.id === id);

      if (index === -1) {
        return false;
      }

      templates[index] = { ...templates[index], ...updates };
      this.saveTemplates(templates);
      return true;
    } catch (error) {
      console.error('更新文本模板失败:', error);
      return false;
    }
  }

  static deleteTemplate(id: string): boolean {
    try {
      const templates = this.getTemplates();
      const index = templates.findIndex(item => item.id === id);

      if (index === -1) {
        return false;
      }

      templates.splice(index, 1);
      this.saveTemplates(templates);
      return true;
    } catch (error) {
      console.error('删除文本模板失败:', error);
      return false;
    }
  }

  static reorderTemplates(fromIndex: number, toIndex: number): boolean {
    try {
      const templates = this.getTemplates();
      if (fromIndex === toIndex) {
        return false;
      }

      const [removed] = templates.splice(fromIndex, 1);
      templates.splice(toIndex, 0, removed);

      templates.forEach((item, index) => {
        item.order = index;
      });

      this.saveTemplates(templates);
      return true;
    } catch (error) {
      console.error('重新排序文本模板失败:', error);
      return false;
    }
  }

  static searchTemplates(keyword: string): TextTemplate[] {
    try {
      const templates = this.getTemplates();
      const lowerKeyword = keyword.toLowerCase().trim();

      if (!lowerKeyword) {
        return templates.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }

      return templates
        .filter(template =>
          template.title.toLowerCase().includes(lowerKeyword) ||
          template.content.toLowerCase().includes(lowerKeyword)
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } catch (error) {
      console.error('搜索文本模板失败:', error);
      return [];
    }
  }

  static clearTemplates(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TEXT_TEMPLATES);
      localStorage.removeItem(DEFAULT_TEMPLATES_KEY);
    } catch (error) {
      console.error('清空文本模板失败:', error);
    }
  }

  static getTemplatesCount(): number {
    return this.getTemplates().length;
  }
}
