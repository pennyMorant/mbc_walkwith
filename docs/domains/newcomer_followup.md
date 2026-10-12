# Newcomer Follow-up Domain

状态：三阶段第一版已接入

## Purpose

定义新朋友资料、来源、跟进负责人、状态流转和转会员边界。新人跟进服务“领人归主”和接待牧养，不替代会员资料或长期关怀。

## Source Of Truth

后端 newcomer follow-up repository 拥有新朋友 profile、跟进状态、负责人、联系记录和转接记录。正式会员资料归 member profile，长期关怀归 pastoral care。

## Core Concepts

- Newcomer：留下联系方式但尚未成为正式会友的人。
- Source：来源，例如官网、新朋友卡、App、活动、主日接待。
- Assignee：负责跟进的新朋友同工或牧者。
- Follow-up：一次计划或已完成的联系记录。
- Conversion：将 newcomer 关联到已有会员、创建会员候选或关闭记录。

## Rules

- 新朋友不是正式会员，不能自动获得会员内容权限。
- 重复记录只提示候选，不自动合并。
- 未登录提交必须绑定 external user id 或可联系信息。
- 内部跟进记录不返回给普通 App。
- 转会员、分配负责人、关闭记录都必须审计。

## Used By

- newcomer follow-up。
- member profile。
- pastoral care。
- discipleship journey。
- group ministry。
- course learning。
- notification delivery。
