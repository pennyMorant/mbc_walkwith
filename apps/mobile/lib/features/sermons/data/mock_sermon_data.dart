import '../domain/sermon.dart';

const List<Sermon> sermons = [
  Sermon(
    id: 'sermon-romans-hope',
    title: '在苦难中的盼望',
    speaker: 'Pastor David Chen',
    date: '2026-06-21',
    series: '罗马书系列',
    topics: ['盼望', '苦难'],
    primaryReference: '罗马书 8:18-30',
    duration: Duration(minutes: 39, seconds: 40),
    summary: '从罗马书第 8 章看圣灵如何在软弱中帮助信徒，并使我们在苦难中持守盼望。',
    outline: [
      SermonOutlineItem(
        title: '现在的苦楚',
        startTime: Duration(minutes: 2),
        summary: '保罗没有否认苦楚，而是把苦楚放在将来的荣耀中衡量。',
      ),
      SermonOutlineItem(
        title: '圣灵的帮助',
        startTime: Duration(minutes: 14),
        summary: '圣灵在我们不会祷告时替我们祈求，说明神的帮助临到真实软弱的人。',
      ),
      SermonOutlineItem(
        title: '神最终的益处',
        startTime: Duration(minutes: 25),
        summary: '万事互相效力的方向，是神使他的百姓效法基督。',
      ),
    ],
    references: [
      SermonReference(
        reference: '罗马书 8:28',
        verseId: 'rom.8.28',
        note: '讲道核心经文',
      ),
      SermonReference(
        reference: '创世记 50:20',
        verseId: 'gen.50.20',
        note: '苦难中神的护理',
      ),
    ],
    transcript: SermonTranscript(
      text:
          '今天我们从罗马书第八章看见，保罗并没有轻看苦楚，却把现在的苦楚放在将来的荣耀面前。圣灵在我们的软弱中帮助我们，也在我们不知道怎样祷告的时候亲自替我们祈求。罗马书 8:28 不是一句轻率的安慰，而是神在基督里坚固的应许：他使万事照着他的旨意，最终把他的百姓塑造成基督的样式。',
      source: 'mock transcript',
      updatedAt: '2026-06-21T18:00:00.000Z',
    ),
  ),
  Sermon(
    id: 'sermon-love',
    title: '不能隔绝的爱',
    speaker: 'Pastor David Chen',
    date: '2026-06-14',
    series: '罗马书系列',
    topics: ['神的爱', '确据'],
    primaryReference: '罗马书 8:31-39',
    duration: Duration(minutes: 42, seconds: 12),
    summary: '神在基督里的爱不是抽象概念，而是在控告、患难和死亡面前仍然坚固的确据。',
    outline: [
      SermonOutlineItem(
        title: '神若帮助我们',
        startTime: Duration(minutes: 4),
        summary: '信徒的确据来自神自己的行动，而不是环境的稳定。',
      ),
      SermonOutlineItem(
        title: '谁能定罪',
        startTime: Duration(minutes: 18),
        summary: '基督已经死而复活，并且为我们祈求。',
      ),
    ],
    references: [
      SermonReference(
        reference: '罗马书 8:39',
        verseId: 'rom.8.39',
        note: '神的爱在基督里显明',
      ),
    ],
  ),
];
