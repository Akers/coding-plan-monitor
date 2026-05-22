## ADDED Requirements

### Requirement: 面板容器最小高度
悬浮面板容器 SHALL 具有最小高度，确保在任何内容状态下（包括无供应商配置的空状态）背景色都能填满整个窗口。

#### Scenario: 无供应商配置时背景填满高度
- **WHEN** 应用启动且未配置任何供应商
- **THEN** 悬浮面板容器的背景色 SHALL 完整填满窗口高度，不留空白区域

#### Scenario: 有供应商配置时内容自适应
- **WHEN** 应用配置了供应商且额度数据正常显示
- **THEN** 悬浮面板容器的背景色 SHALL 覆盖从顶部到底部的全部区域

## MODIFIED Requirements

### Requirement: 上次刷新时间显示
面板底部 SHALL 显示最后一次成功刷新数据的时间。当数据尚未刷新时 SHALL 显示"尚未刷新"提示。

#### Scenario: 显示刷新时间
- **WHEN** 面板显示额度数据且至少一次成功刷新
- **THEN** 底部 SHALL 显示"X秒前更新"或"X分钟前更新"

#### Scenario: 从未刷新时的提示
- **WHEN** 面板启动后尚未进行过任何数据刷新
- **THEN** 底部 SHALL 显示"尚未刷新"文本
