-- Seed clearly marked test quotes so the Daily Quote page can be verified
-- while the production public mailbox has no approved source letters.
INSERT INTO daily_quotes ("letterId", quote, "emotionTags", date)
VALUES
  (0, '[测试数据] 愿你今晚放慢脚步，也允许自己被温柔地接住。', '["陪伴", "测试"]'::jsonb, CURRENT_DATE - 2),
  (0, '[测试数据] 不是所有答案都要马上出现，给心事一点安静生长的时间。', '["希望", "测试"]'::jsonb, CURRENT_DATE - 1),
  (0, '[测试数据] 你已经走了很远，今夜也值得为自己留一盏灯。', '["治愈", "测试"]'::jsonb, CURRENT_DATE)
ON CONFLICT (date) DO NOTHING;
