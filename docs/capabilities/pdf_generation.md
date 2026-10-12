# PDF Generation

状态：PDF 生成能力边界

## Purpose

封装年度证明、未来周报或导出文件的 PDF 生成能力。

## Owner

Backend PDF generation adapter/service。

## Contract

输入：

- document type。
- structured payload。
- locale。
- template version。
- correlation id。

输出：

- PDF bytes or object key。
- generation status。
- template version。
- checksum。

## Rules

- PDF capability 不计算业务金额。
- PDF capability 不决定下载权限。
- 生成失败必须可诊断。
- 超过单页容量的明细必须分页，不能继续绘制到页面边界外。
- 模板版本应记录。
- 敏感 PDF 存私有对象存储。

## Errors

- `pdf_template_missing`
- `pdf_generation_failed`
- `pdf_payload_invalid`
- `pdf_storage_failed`

## Used By

- [../features/annual_statement.md](../features/annual_statement.md)
