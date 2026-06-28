export const initialScenarios = [
  {
    id: 'scen-angina',
    subject: '내과',
    difficulty: '상',
    patientName: '김정수',
    age: 54,
    gender: '남',
    tag: '협심증 의증',
    cc: '"오늘 아침부터 가슴이 쥐어짜듯이 아파요."',
    vs: 'BP 138/85, HR 88회/분, RR 18회/분, BT 36.6°C',
    notes: '환자가 심장 질환에 대한 공포심이 큽니다. 불안을 달래며 병력을 조사하세요.',
    goals: [
      '가슴 통증의 양상(쥐어짜는 느낌 등) 및 지속 시간 확인',
      '통증의 유발/완화 요인(운동 시 악화, 휴식 시 호전) 확인',
      '방사통 여부(왼쪽 어깨, 턱 등) 확인',
      '고혈압, 고지혈증, 흡연력 등 위험 요인 문진',
      '설명 및 교육 (안심시키고 혀 밑 투약 방법 설명)'
    ],
    attempts: 3,
    bestScore: 88,
    distribution: [5, 10, 25, 45, 15],
    avatar: '👨‍💼',
    rubrics: [
      { id: 'r1', category: '병력청취', item: '가슴 통증이 언제 시작되었고 얼마나 지속되었는지 질문함', weight: 20, checked: false, keyword: ['언제', '시간', '얼마나', '시작'] },
      { id: 'r2', category: '병력청취', item: '통증의 양상(쥐어짜는 느낌, 뻐근함)을 개방형 질문으로 확인함', weight: 20, checked: false, keyword: ['어떻게', '느낌', '양상', '아프'] },
      { id: 'r3', category: '병력청취', item: '왼쪽 팔, 어깨, 턱 등으로 뻗치는 통증(방사통)이 있는지 확인함', weight: 20, checked: false, keyword: ['어깨', '팔', '턱', '방사'] },
      { id: 'r4', category: '의사소통', item: '환자의 통증 호소에 적절한 정서적 지지("많이 무서우셨겠어요")를 표현함', weight: 20, checked: false, keyword: ['걱정', '무서', '아프시겠', '힘들'] },
      { id: 'r5', category: '설명교육', item: '급성 흉통 대처법(안정 취하기, 설하정 복용 등)에 대해 친절하게 설명함', weight: 20, checked: false, keyword: ['쉬어', '약', '안정', '병원'] }
    ],
    script: {
      initial: '아이구, 의사 선생님... 오늘 아침부터 왼쪽 가슴이 너무 아파서 죽겠습니다. 심장마비라도 온 게 아닐까요? 무서워 죽겠어요.',
      dialogs: [
        { keywords: ['언제', '시작', '얼마나', '시간'], response: '오늘 아침 7시쯤 화장실 가려는데 갑자기 쥐어짜듯이 아팠어요. 한 10분 정도 지나니까 조금 덜한데 아직도 뻐근해요.' },
        { keywords: ['어떻게', '느낌', '양상', '쥐어', '아프'], response: '가슴 한가운데를 꽉 쥐어짜는 느낌이에요. 명치 윗부분이 뻐근하고 숨이 잘 안 쉬어지는 기분이에요.' },
        { keywords: ['어깨', '팔', '턱', '방사', '다른'], response: '네! 마침 가슴이 아프면서 왼쪽 어깨랑 목 쪽도 찌릿찌릿 아파서 아주 무서웠습니다.' },
        { keywords: ['약', '먹', '치료', '병원', '대처'], response: '아니요, 약은 평소 먹는 혈압약 말고는 먹은 게 없어요. 혀 밑에 넣는 약이 있다던데 그건 어떻게 쓰는 건가요?' },
        { keywords: ['고혈압', '흡연', '담배', '당뇨', '가족력'], response: '고혈압 진단받고 혈압약 먹은 지는 5년 정도 됐고요. 담배는 하루에 한 갑씩 30년째 피우고 있습니다. 당뇨는 없습니다.' },
        { keywords: ['걱정', '안심', '괜찮', '무서', '지지'], response: '그렇게 친절하게 설명해 주시니 좀 마음이 놓이네요. 심장이 완전히 잘못된 건 아니겠죠?' }
      ],
      fallback: '가슴이 계속 답답하고 무서워서 정신이 없네요. 다른 건 잘 모르겠고 통증이 왜 가라앉지 않는지 모르겠어요.'
    }
  },
  {
    id: 'scen-migraine',
    subject: '신경과',
    difficulty: '중',
    patientName: '이유리',
    age: 28,
    gender: '여',
    tag: '급성 두통 (편두통 의증)',
    cc: '"선생님, 머리가 너무 깨질 것 같이 아프고 매스꺼워요."',
    vs: 'BP 118/74, HR 72회/분, RR 14회/분, BT 36.8°C',
    notes: '환자는 빛과 소리에 매우 민감합니다. 차분하고 낮은 음성으로 진료하세요.',
    goals: [
      '두통의 상세 위치(편측성 여부) 및 쿵쾅거리는 맥박성 통증 여부 확인',
      '동반 증상(오심, 구토, 빛/소리 공포증) 확인',
      '두통 전조 증상(눈앞이 번쩍임 등) 여부 문진',
      '스트레스, 수면 부족 등 유발 요인 파악',
      '비약물적 대처법(어두운 곳에서 휴식) 교육 및 처방 설명'
    ],
    attempts: 1,
    bestScore: 92,
    distribution: [0, 5, 20, 50, 25],
    avatar: '👩‍💼',
    rubrics: [
      { id: 'r1', category: '병력청취', item: '두통의 위치가 한쪽(편측성)이고 심장이 뛰듯 아픈지(맥박성) 질문함', weight: 20, checked: false, keyword: ['한쪽', '오른', '왼', '뛰', '맥박'] },
      { id: 'r2', category: '병력청취', item: '두통 발생 전 눈앞이 번쩍이는 등의 전조 증상이 있었는지 확인함', weight: 20, checked: false, keyword: ['전조', '눈', '번쩍', '아지랑이'] },
      { id: 'r3', category: '병력청취', item: '오심/구토 등 소화기 동반 증상 및 빛/소리 민감성을 파악함', weight: 20, checked: false, keyword: ['오심', '토', '울렁', '빛', '소리'] },
      { id: 'r4', category: '의사소통', item: '빛을 피할 수 있게 병실 조명을 낮춰주거나 차분하게 대응함', weight: 20, checked: false, keyword: ['불', '조명', '어둡', '차분'] },
      { id: 'r5', category: '설명교육', item: '편두통의 원인 및 카페인/수면 조절 등 생활 습관 예방을 설명함', weight: 20, checked: false, keyword: ['커피', '잠', '스트레스', '예방'] }
    ],
    script: {
      initial: '선생님... 머리가 너무 깨질 것 같아요. 속도 미식거리고... 여기 조명이 너무 눈부신데 조금만 조용히 얘기해주시면 안 될까요?',
      dialogs: [
        { keywords: ['어디', '양상', '어떻게', '한쪽', '오른쪽', '왼쪽'], response: '오른쪽 관자놀이 있는 쪽이 심장 뛰는 것처럼 쿵쾅쿵쾅 아파요. 머리가 흔들릴 때마다 욱신거려요.' },
        { keywords: ['눈', '번쩍', '빛', '전조'], response: '아! 맞아요. 한 시간 전쯤 머리가 아프기 직전에 눈앞에 지그재그 모양의 번쩍이는 불빛 같은 게 생겼다가 사라졌어요.' },
        { keywords: ['소화', '울렁', '오심', '토', '메스껍'], response: '네, 속이 너무 울렁거려서 아까 화장실에서 헛구역질을 심하게 했어요. 밥 먹을 생각도 안 나요.' },
        { keywords: ['스트레스', '잠', '수면'], response: '요즘 회사 야근 때문에 잠을 하루에 4시간도 못 잤어요. 스트레스가 극에 달해서 그런 걸까요?' },
        { keywords: ['빛', '조명', '불', '끄'], response: '아.. 불을 좀 어둡게 해주시니 눈 아픈 게 훨씬 나아요. 정말 감사합니다.' }
      ],
      fallback: '속이 너무 안 좋고 머리가 욱신거려서 눕고 싶어요. 약 먹으면 가라앉을까요?'
    }
  },
  {
    id: 'scen-diabetes',
    subject: '내과',
    difficulty: '하',
    patientName: '박창호',
    age: 42,
    gender: '남',
    tag: '당뇨 만성 관리',
    cc: '"소변을 자주 보고 목이 타들어 가듯이 자주 마릅니다."',
    vs: 'BP 125/78, HR 70회/분, RR 16회/분, BT 36.4°C',
    notes: '환자는 직장인으로 술자리가 잦고 식습관 관리가 되지 않고 있습니다.',
    goals: [
      '당뇨의 3대 증상(다뇨, 다음, 다식) 여부 확인',
      '체중 감소량 및 피로감 기간 문진',
      '식이요법 및 음주 상태 확인',
      '만성 합병증(눈 침침함, 손발 저림) 스크리닝',
      '운동법 및 탄수화물 제한 식이 교육'
    ],
    attempts: 5,
    bestScore: 95,
    distribution: [2, 3, 10, 35, 50],
    avatar: '👨‍💼',
    rubrics: [
      { id: 'r1', category: '병력청취', item: '소변량 증가(다뇨), 음수량 증가(다음), 식사량 증가(다식) 3대 증상을 물어봄', weight: 20, checked: false, keyword: ['소변', '물', '음료', '갈증', '배고파'] },
      { id: 'r2', category: '병력청취', item: '의도하지 않은 최근 체중 감소량(kg) 및 피로 강도를 구체적으로 파악함', weight: 20, checked: false, keyword: ['체중', '무게', '살', '빠지', '피로'] },
      { id: 'r3', category: '병력청취', item: '평소 식습관, 운동 여부 및 주당 음주 횟수를 조사함', weight: 20, checked: false, keyword: ['술', '음주', '식사', '운동', '습관'] },
      { id: 'r4', category: '병력청취', item: '당뇨 합병증 선별을 위해 시야 이상(눈 침침)이나 손발 끝 저림을 확인함', weight: 20, checked: false, keyword: ['저림', '손', '발', '눈', '침침'] },
      { id: 'r5', category: '설명교육', item: '합병증 예방의 중요성과 유산소 운동(주 150분 이상) 및 식이관리를 설명함', weight: 20, checked: false, keyword: ['식단', '야채', '유산소', '합병증', '인슐린'] }
    ],
    script: {
      initial: '안녕하세요 선생님. 최근 들어 소변을 너무 자주 보러 가고 물을 아무리 마셔도 갈증이 나서 건강검진 겸 왔습니다. 살도 좀 빠진 것 같아요.',
      dialogs: [
        { keywords: ['소변', '물', '갈증', '먹', '배'], response: '하루에 물을 3리터 넘게 마시는 것 같아요. 화장실도 밤에 자다가 두세 번은 꼭 깨서 갑니다. 밥도 먹어도 먹어도 돌아서면 또 배가 고파요.' },
        { keywords: ['체중', '몸무게', '살', '빠지'], response: '두 달 만에 거의 5kg 정도가 그냥 빠졌습니다. 특별히 다이어트를 한 것도 아닌데 셔츠가 헐렁해졌어요.' },
        { keywords: ['술', '음주', '맥주', '회식'], response: '직장 상사라 주 3회는 삼겹살에 소맥을 마십니다. 주말엔 누워 있느라 운동할 시간이 전혀 없습니다.' },
        { keywords: ['저리', '손', '발', '눈', '침침'], response: '아.. 요즘 스마트폰 볼 때 눈이 부쩍 침침하고, 아침에 일어날 때 발바닥 끝이 찌릿찌릿 저린 느낌이 드는데 이것도 연관이 있나요?' },
        { keywords: ['운동', '음식', '식사', '예방'], response: '네, 앞으로 술을 줄이고 저녁에 걷기 운동이라도 꾸준히 해야겠네요. 현미밥 위주로 먹으면 되나요?' }
      ],
      fallback: '제가 당뇨가 맞다면 평생 약을 먹어야 하나요? 합병증이 올까 봐 걱정스럽네요.'
    }
  }
];

export const initialNotifications = [
  { id: 'n1', text: '의사소통 역량 루브릭(v1.2) 업데이트가 완료되었습니다.', time: '10분 전', unread: true },
  { id: 'n2', text: '김정수 환자 시나리오의 전문가 검수 코멘트가 새로 추가되었습니다.', time: '2시간 전', unread: true },
  { id: 'n3', text: '예비 의사 김하나님, 오늘 D-day 목표 학습시간까지 1시간 남았습니다.', time: '5시간 전', unread: false }
];

export const initialHistory = [
  {
    id: 'h1',
    scenarioId: 'scen-angina',
    date: '2026.06.26 11:20',
    duration: '08:12',
    ratio: '42:58',
    satisfaction: 80,
    ppi: '우수(A)',
    score: 80,
    checkedRubrics: ['r1', 'r2', 'r4'],
    transcript: [
      { speaker: 'doctor', text: '안녕하세요. 오늘 어떤 불편함 때문에 오셨을까요?' },
      { speaker: 'patient', text: '가슴이 너무 아파서 왔어요. 심장이 쪼여드는 것처럼요...' },
      { speaker: 'doctor', text: '가슴이 쪼여드는 느낌이 드시는군요. 언제부터 그러셨나요?' },
      { speaker: 'patient', text: '오늘 아침 한 7시쯤 화장실 가려고 할 때 그랬어요. 한 10분 정도 그랬습니다.' },
      { speaker: 'doctor', text: '아침부터 정말 무서우셨겠습니다. 가슴 통증 외에 어깨나 턱 쪽으로 찌릿한 증상은 없었나요?' },
      { speaker: 'patient', text: '네, 왼쪽 어깨도 같이 찌릿찌릿 아파서 아주 놀랐어요.' },
      { speaker: 'doctor', text: '그렇군요. 그럼 협심증 의심 증상일 수 있습니다. 병원에서 일단 정밀 검사를 받으시고 절대 무리하지 마세요.' }
    ]
  },
  {
    id: 'h2',
    scenarioId: 'scen-diabetes',
    date: '2026.06.25 15:45',
    duration: '09:40',
    ratio: '50:50',
    satisfaction: 95,
    ppi: '매우 우수(S)',
    score: 95,
    checkedRubrics: ['r1', 'r2', 'r3', 'r4', 'r5'],
    transcript: [
      { speaker: 'doctor', text: '안녕하세요, 소변이 잦고 갈증이 심하시다 해서 오셨는데 자세히 말씀해 주세요.' },
      { speaker: 'patient', text: '예, 하루 종일 물을 마셔도 목이 타고 소변을 대여섯 번 이상 보러 갑니다. 배도 늘 고파요.' },
      { speaker: 'doctor', text: '전형적인 다뇨, 다음, 다식 증상이군요. 혹시 체중 변화는 어땠나요?' },
      { speaker: 'patient', text: '체중이 두 달 새에 5kg나 줄었어요. 회사 일 때문에 피곤하기도 하고요.' },
      { speaker: 'doctor', text: '기왕력 조사를 위해 평소 술, 담배 및 식습관은 어떤지 여쭐게요.' },
      { speaker: 'patient', text: '술은 주 3회 삼겹살 회식하고, 주말엔 전혀 운동 안 하고 누워만 있습니다.' },
      { speaker: 'doctor', text: '손끝이나 발끝이 저리시거나 눈이 침침한 증상이 나타나진 않았습니까?' },
      { speaker: 'patient', text: '스마트폰 볼 때 아주 침침하고, 일어날 때 발끝이 지릿한 적이 있어요.' },
      { speaker: 'doctor', text: '당뇨 합병증 초기 증세일 수 있으니 식단을 야채와 현미 위주로 조절하시고 주 150분 이상 유산소 운동을 필수적으로 병행하셔야 합니다.' }
    ]
  }
];

export const initialRubricHistoryLogs = {
  'scen-angina': [
    { ver: 'v1.2', author: '최교수 (순환기)', date: '2026-06-25 14:00', desc: '의사소통 공감 및 혀밑 투약 설명 키워드 가중치 상향 조정.' },
    { ver: 'v1.1', author: '박평가원 (행정)', date: '2026-05-10 11:20', desc: '초기 루브릭 문진 가중치 배분 완료.' }
  ],
  'scen-migraine': [
    { ver: 'v1.0', author: '이교수 (신경과)', date: '2026-06-01 09:30', desc: '신규 두통 시나리오용 루브릭 최초 배포.' }
  ]
};

export const initialExpertTimelineLogs = {
  'scen-angina': [
    { author: '강교수 (의대본과장)', comment: '협심증 증상의 흉통 통증 양상 가중치는 20점 이상이어야 타당도가 확보됩니다.', date: '2026-06-24', approved: true },
    { author: '한평가원 (행정실)', comment: '현업 평가표와 일치하게 문구 수정 권장.', date: '2026-05-02', approved: false }
  ],
  'scen-migraine': [
    { author: '신경과 전문의 최선생', comment: '눈 앞 번쩍임 같은 전조 증상(Aura) 문진 항목 배점 배분 적절함.', date: '2026-05-30', approved: true }
  ]
};
