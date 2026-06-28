export const initialScenarios = [
  {
    id: 'scen-fever-1',
    subject: '혈액종양내과',
    difficulty: '상',
    patientName: '김민준',
    age: 28,
    gender: '남',
    tag: '급성 백혈병 의증',
    cc: '"2주 전부터 열이 나고, 몸에 멍이 잘 들어요."',
    vs: 'BT: 38.3°C / BP: 110/70 mmHg / HR: 102회/분 / RR: 20회/분',
    notes: '환자가 불안해합니다. 출혈과 발열이 동반된 양상을 파악하고 골수침범 3징후를 확인하세요.',
    goals: [
      '발열 및 출혈 동반 증상 (피로감, 잇몸 출혈 등) 확인',
      '최근 약물 복용력 및 감염 징후 문진',
      '흉골 압통, 간/비장 비대 등 신체 검진 계획',
      '환자의 불안감 지지 및 공감',
      '정밀 검사(골수 검사) 및 입원 계획 설명'
    ],
    attempts: 0,
    bestScore: 0,
    distribution: [0, 0, 0, 0, 0],
    avatar: '👨‍🦱',
    rubrics: [
      { id: 'r1', category: '병력청취', item: '발열과 함께 출혈 경향(멍, 잇몸 출혈) 및 빈혈(피로감) 증상을 확인함', weight: 20, checked: false, keyword: ['피로', '멍', '출혈', '잇몸'] },
      { id: 'r2', category: '진단계획', item: '흉골 압통, 간/비장 비대 및 림프절 비대 등 백혈병 관련 신체진찰을 언급함', weight: 20, checked: false, keyword: ['비장', '간', '림프절', '가슴뼈', '흉골'] },
      { id: 'r3', category: '의사소통', item: '젊은 나이에 생긴 갑작스러운 증상에 대한 불안을 공감하고 지지함', weight: 20, checked: false, keyword: ['걱정', '무서', '불안', '이해'] },
      { id: 'r4', category: '설명교육', item: '혈액 질환(백혈병 등) 가능성을 설명하고 골수 검사 등 정밀검사 필요성 안내', weight: 20, checked: false, keyword: ['혈액', '백혈병', '골수', '검사'] },
      { id: 'r5', category: '설명교육', item: '현재 면역력과 지혈 기능 저하로 감염 및 출혈 예방 교육을 수행함', weight: 20, checked: false, keyword: ['감염', '마스크', '부딪힘', '출혈', '예방'] }
    ],
    script: {
      initial: '선생님, 2주 전부터 미열이랑 고열이 오르락내리락 하는데 해열제를 먹어도 소용이 없어요. 그리고 몸에 멍도 잘 들고 양치할 때 피가 안 멎어요. 저 큰 병인가요?',
      dialogs: [],
      fallback: '피곤하고 무서워서 더 이상 말하기 힘드네요.'
    }
  },
  {
    id: 'scen-fever-2',
    subject: '감염내과',
    difficulty: '중',
    patientName: '이진우',
    age: 45,
    gender: '남',
    tag: '약물열 의증',
    cc: '"며칠 전부터 갑자기 39도까지 열이 나요."',
    vs: 'BT: 39.1°C / BP: 128/80 mmHg / HR: 78회/분 (상대적 서맥) / RR: 18회/분',
    notes: '고열에도 불구하고 환자의 전신 상태가 양호합니다. 최근 복용 시작한 약물을 찾아내세요.',
    goals: [
      '발열 양상 및 상대적으로 양호한 전신 상태 파악',
      '국소 감염 증상(기침, 설사 등) 배제',
      '새로 복용하기 시작한 약물(통풍약 등) 문진',
      '약물 부작용에 대한 안심과 지지',
      '의심 약물 즉시 중단 지시 및 경과 설명'
    ],
    attempts: 0,
    bestScore: 0,
    distribution: [0, 0, 0, 0, 0],
    avatar: '👨‍💼',
    rubrics: [
      { id: 'r1', category: '병력청취', item: '기침, 가래, 배뇨통 등 국소 감염 증상이 없는지 확인함', weight: 20, checked: false, keyword: ['기침', '가래', '소변', '설사', '감기'] },
      { id: 'r2', category: '병력청취', item: '최근 새롭게 복용하기 시작한 약물(통풍약 알로푸리놀 등)을 확인함', weight: 20, checked: false, keyword: ['약', '통풍', '새로', '복용'] },
      { id: 'r3', category: '진단계획', item: '고열 대비 심박수가 낮은 상대적 서맥 및 피부 발진 여부를 확인함', weight: 20, checked: false, keyword: ['맥박', '발진', '반점', '피부'] },
      { id: 'r4', category: '의사소통', item: '새로 받은 약 때문에 열이 났을 가능성에 당황한 환자를 안심시킴', weight: 20, checked: false, keyword: ['부작용', '안심', '당황', '놀라'] },
      { id: 'r5', category: '설명교육', item: '의심 약물(통풍약) 즉각 중단을 지시하고 수일 내 해열될 것임을 설명함', weight: 20, checked: false, keyword: ['중단', '끊', '해열', '떨어'] }
    ],
    script: {
      initial: '선생님, 3일 전부터 갑자기 39도까지 열이 나요. 해열제를 먹으면 잠깐 내렸다가 다시 오릅니다. 감기 증상은 전혀 없는데 왜 이럴까요?',
      dialogs: [],
      fallback: '열이 왜 나는지 모르니까 답답하네요.'
    }
  },
  {
    id: 'scen-fever-3',
    subject: '류마티스내과',
    difficulty: '상',
    patientName: '박지윤',
    age: 24,
    gender: '여',
    tag: 'SLE(전신홍반루푸스) 의증',
    cc: '"한 달 전부터 미열이 계속 나고, 양쪽 손목과 손가락이 아파요."',
    vs: 'BT: 37.8°C / BP: 116/72 mmHg / HR: 88회/분 / RR: 17회/분',
    notes: '젊은 여성의 불명열 및 다관절통. 광과민성과 나비모양 발진 등 전신 침범 소견을 파악하세요.',
    goals: [
      '미열 및 대칭성 관절통 양상 확인',
      '피부 발진(Malar rash) 및 광과민성 문진',
      '구강 궤양, 단백뇨(거품뇨) 등 전신 증상 확인',
      '외모 변화로 인한 스트레스에 공감',
      '자가면역질환 가능성 및 자외선 차단 교육'
    ],
    attempts: 0,
    bestScore: 0,
    distribution: [0, 0, 0, 0, 0],
    avatar: '👩',
    rubrics: [
      { id: 'r1', category: '병력청취', item: '양측 손목 및 손가락의 대칭성 관절통을 확인함', weight: 20, checked: false, keyword: ['양쪽', '대칭', '관절', '손가락', '손목'] },
      { id: 'r2', category: '병력청취', item: '햇빛 노출 시 악화되는 뺨의 나비모양 발진(Malar rash) 유무를 확인함', weight: 20, checked: false, keyword: ['햇빛', '자외선', '발진', '얼굴', '뺨'] },
      { id: 'r3', category: '병력청취', item: '구강 궤양(입 헐음) 및 단백뇨(거품뇨), 탈모 등 전신 증상 여부를 물어봄', weight: 20, checked: false, keyword: ['입', '헐', '궤양', '소변', '거품', '탈모'] },
      { id: 'r4', category: '의사소통', item: '얼굴 발진 등 외모 변화에 대한 환자의 극심한 스트레스에 공감함', weight: 20, checked: false, keyword: ['스트레스', '속상', '이해', '외모'] },
      { id: 'r5', category: '설명교육', item: '자가면역질환(루푸스) 의심 소견을 설명하고 자외선 차단제 사용을 교육함', weight: 20, checked: false, keyword: ['루푸스', '자가면역', '자외선', '썬크림'] }
    ],
    script: {
      initial: '한 달 전부터 계속 미열이 나고, 양쪽 손목이랑 손가락 마디가 너무 아파요. 그리고 얼굴 양쪽 뺨에 나비 모양으로 빨갛게 발진이 생겼는데 화장으로도 안 가려져서 너무 스트레스 받아요.',
      dialogs: [],
      fallback: '얼굴 때문에 너무 우울해요.'
    }
  },
  {
    id: 'scen-fever-4',
    subject: '이비인후과',
    difficulty: '하',
    patientName: '최우진',
    age: 32,
    gender: '남',
    tag: '상기도 감염(URI)',
    cc: '"어제부터 열이 나고 목이 아파요."',
    vs: 'BT: 38.0°C / BP: 122/76 mmHg / HR: 90회/분 / RR: 17회/분',
    notes: '가장 흔한 발열 원인. 세균성 편도염 및 인플루엔자와 감별하세요.',
    goals: [
      '인후통, 콧물, 기침 등 상기도 3주증 확인',
      '화농성 가래 및 심한 고열 배제',
      '편도 삼출물 및 림프절 압통 진찰',
      '중요한 일정을 앞둔 환자의 불안 해소',
      '바이러스 감염 설명 및 불필요한 항생제 자제 교육'
    ],
    attempts: 0,
    bestScore: 0,
    distribution: [0, 0, 0, 0, 0],
    avatar: '👨‍🦱',
    rubrics: [
      { id: 'r1', category: '병력청취', item: '인후통과 함께 콧물, 기침 등 동반 호흡기 증상을 확인함', weight: 20, checked: false, keyword: ['콧물', '기침', '가래', '호흡'] },
      { id: 'r2', category: '진단계획', item: '세균성 감별을 위해 편도 삼출물 여부와 경부 림프절 압통을 확인함', weight: 20, checked: false, keyword: ['편도', '목', '림프절', '고름'] },
      { id: 'r3', category: '진단계획', item: '인플루엔자/코로나 배제를 위한 신속항원검사(Rapid test) 시행을 계획함', weight: 20, checked: false, keyword: ['독감', '코로나', '검사', '키트'] },
      { id: 'r4', category: '의사소통', item: '중요한 발표를 앞두고 아픈 환자의 상황에 공감하며 회복을 격려함', weight: 20, checked: false, keyword: ['발표', '중요', '걱정', '격려'] },
      { id: 'r5', category: '설명교육', item: '단순 바이러스 감염임을 설명하고 휴식, 수분 섭취 및 항생제 불필요성을 교육함', weight: 20, checked: false, keyword: ['바이러스', '휴식', '물', '수분', '항생제'] }
    ],
    script: {
      initial: '어제부터 38도 정도 열이 나고 침 삼킬 때 목이 너무 아파요. 내일 진짜 중요한 회사 발표가 있는데 독감이나 코로나면 어쩌죠? 빨리 낫고 싶어요.',
      dialogs: [],
      fallback: '목이 아파서 말하기 힘드네요.'
    }
  },
  {
    id: 'scen-fever-5',
    subject: '신장내과',
    difficulty: '중',
    patientName: '정수아',
    age: 29,
    gender: '여',
    tag: '급성 신우신염(APN)',
    cc: '"열이 많이 나고 오른쪽 허리가 아파요."',
    vs: 'BT: 39.2°C / BP: 108/68 mmHg / HR: 106회/분 / RR: 20회/분',
    notes: '배뇨 이상 후 발생한 고열과 측복부 통증. CVA 타진이 핵심입니다.',
    goals: [
      '고열, 오한 및 측복부 통증 양상 확인',
      '선행하는 배뇨 이상(빈뇨, 배뇨통) 여부 확인',
      '골반염(PID) 및 결석 감별 문진',
      '우측 CVA 타진 전 양해 구하기',
      '신우신염 진단 및 충분한 수분 섭취 교육'
    ],
    attempts: 0,
    bestScore: 0,
    distribution: [0, 0, 0, 0, 0],
    avatar: '👩',
    rubrics: [
      { id: 'r1', category: '병력청취', item: '고열, 오한과 함께 오른쪽 옆구리(측복부) 통증의 양상을 확인함', weight: 20, checked: false, keyword: ['옆구리', '허리', '오한', '측복부'] },
      { id: 'r2', category: '병력청취', item: '최근 배뇨통, 빈뇨, 잔뇨감 등 하부요로감염(방광염) 증상이 있었는지 물어봄', weight: 20, checked: false, keyword: ['소변', '배뇨', '빈뇨', '잔뇨'] },
      { id: 'r3', category: '진단계획', item: '핵심 진찰인 우측 늑골척추각(CVA) 타진 압통을 시행함을 명시함', weight: 20, checked: false, keyword: ['등', '두드려', 'CVA', '늑골'] },
      { id: 'r4', category: '의사소통', item: '고열과 통증으로 허리 디스크를 걱정하는 환자의 두려움에 공감함', weight: 20, checked: false, keyword: ['디스크', '무서', '아프', '공감'] },
      { id: 'r5', category: '설명교육', item: '요로 감염이 신장으로 올라간 신우신염임을 설명하고 항생제 치료 및 수분 섭취를 강조함', weight: 20, checked: false, keyword: ['신우신염', '신장', '수분', '항생제', '물'] }
    ],
    script: {
      initial: '이틀 전부터 39도 넘게 열이 펄펄 나고 오한이 듭니다. 게다가 오른쪽 허리랑 옆구리 쪽이 너무 아파서 처음엔 허리 디스크인 줄 알았는데 너무 무서워요.',
      dialogs: [],
      fallback: '허리가 욱신거려서 눕고 싶어요.'
    }
  },
  {
    id: 'scen-fever-6',
    subject: '순환기내과',
    difficulty: '상',
    patientName: '이철호',
    age: 55,
    gender: '남',
    tag: '감염성 심내막염 의증',
    cc: '"한 달 전부터 미열이 계속 나고 피곤해요."',
    vs: 'BT: 37.8°C / BP: 132/84 mmHg / HR: 92회/분 / RR: 18회/분',
    notes: '아급성 불명열. 최근 치과 시술력과 심잡음 청진 등 Duke criteria를 떠올리세요.',
    goals: [
      '미열의 기간(4주) 및 B symptom(체중감소, 식은땀) 확인',
      '최근 치과 시술 등 균혈증 유발 요인 파악',
      '비장 경색(좌상복부통) 및 미세 출혈(손톱밑 멍) 확인',
      '심음 청진(새로운 심잡음) 계획',
      '장기 항생제 및 입원 치료 설명'
    ],
    attempts: 0,
    bestScore: 0,
    distribution: [0, 0, 0, 0, 0],
    avatar: '👨‍🦳',
    rubrics: [
      { id: 'r1', category: '병력청취', item: '미열의 지속 기간과 체중 감소, 식은땀 등 전신 증상을 확인함', weight: 20, checked: false, keyword: ['체중', '식은땀', '얼마나', '기간'] },
      { id: 'r2', category: '병력청취', item: '최근 치과 시술(발치, 임플란트 등)이나 감염을 유발할 만한 선행 사건을 문진함', weight: 20, checked: false, keyword: ['치과', '발치', '임플란트', '시술'] },
      { id: 'r3', category: '진단계획', item: '새롭게 발생한 심잡음 청진 및 비장 비대, 손톱 밑 미세 출혈 여부를 진찰함', weight: 20, checked: false, keyword: ['청진', '심장', '잡음', '손톱', '비장'] },
      { id: 'r4', category: '의사소통', item: '원인을 모른 채 한 달간 감기약만 먹으며 고생한 환자의 답답함에 공감함', weight: 20, checked: false, keyword: ['답답', '고생', '오래', '이해'] },
      { id: 'r5', category: '설명교육', item: '감염성 심내막염 의심 소견을 설명하고, 혈액 배양 검사와 장기 입원 항생제 치료를 안내함', weight: 20, checked: false, keyword: ['심내막염', '입원', '심초음파', '배양', '항생제'] }
    ],
    script: {
      initial: '벌써 한 달째 매일 미열이 나고 식은땀이 나요. 체중도 4kg이나 빠졌고 손톱 밑에 이상한 피멍도 생겼습니다. 동네 내과에서 감기약만 주던데 낫지도 않고 대체 무슨 병입니까?',
      dialogs: [],
      fallback: '기운이 빠져서 말하기 힘듭니다.'
    }
  },
  {
    id: 'scen-fever-7',
    subject: '감염내과',
    difficulty: '중',
    patientName: '박성진',
    age: 48,
    gender: '남',
    tag: '연조직염(Cellulitis)',
    cc: '"오른쪽 정강이가 빨갛게 부어오르고 열이 나요."',
    vs: 'BT: 38.5°C / BP: 136/86 mmHg / HR: 96회/분 / RR: 18회/분',
    notes: '피부 감염 4징후 확인. 당뇨 환자이므로 당 조절의 중요성을 교육하세요.',
    goals: [
      '발적, 열감, 부종, 압통 확인',
      '외상력(긁힘) 또는 무좀 등 감염 경로 파악',
      '당뇨 병력 및 병변 진행 상황 확인',
      '다리 절단에 대한 환자의 과도한 공포 완화',
      '다리 거상 및 항생제 치료, 당뇨 관리 교육'
    ],
    attempts: 0,
    bestScore: 0,
    distribution: [0, 0, 0, 0, 0],
    avatar: '👨‍💼',
    rubrics: [
      { id: 'r1', category: '병력청취', item: '해당 부위의 발적, 열감, 부종, 압통 4대 감염 징후를 확인함', weight: 20, checked: false, keyword: ['빨갛', '열감', '부어', '아프'] },
      { id: 'r2', category: '병력청취', item: '최근 다리를 긁히거나 상처를 입은 적이 있는지(또는 무좀 여부)를 확인함', weight: 20, checked: false, keyword: ['상처', '긁', '무좀', '다치'] },
      { id: 'r3', category: '진단계획', item: '병변의 경계가 불명확한 점을 진찰하고, 펜으로 경계를 표시해 진행 여부를 확인하겠다고 함', weight: 20, checked: false, keyword: ['경계', '표시', '펜', '마커', '진행'] },
      { id: 'r4', category: '의사소통', item: '당뇨 때문에 다리를 절단할까 봐 두려워하는 환자를 안심시킴', weight: 20, checked: false, keyword: ['절단', '안심', '걱정', '치료'] },
      { id: 'r5', category: '설명교육', item: '연조직염을 설명하고, 다리를 심장보다 높게 거상할 것과 당뇨 혈당 관리의 중요성을 교육함', weight: 20, checked: false, keyword: ['연조직염', '올려', '거상', '당뇨', '혈당'] }
    ],
    script: {
      initial: '3일 전에 등산하다 나뭇가지에 오른쪽 종아리를 살짝 긁혔는데, 어젯밤부터 갑자기 정강이가 빨갛게 붓고 욱신거리면서 38.5도 열이 나요. 저 당뇨가 있는데 혹시 발 잘라야 하나요?',
      dialogs: [],
      fallback: '다리가 아파서 서 있기가 힘드네요.'
    }
  },
  {
    id: 'scen-fever-8',
    subject: '감염내과',
    difficulty: '중',
    patientName: '김태훈',
    age: 22,
    gender: '남',
    tag: '말라리아 의증',
    cc: '"며칠 전부터 열이 펄펄 끓다가 떨어지기를 반복해요."',
    vs: 'BT: 39.4°C / BP: 112/70 mmHg / HR: 108회/분 / RR: 20회/분',
    notes: '전방 복무 군인의 48시간 주기 발열. 역학적 접근이 핵심입니다.',
    goals: [
      '오한-발열-발한의 3단계 및 48시간 주기 패턴 확인',
      '군 복무지(철원 등) 및 모기 교상력 파악',
      '동반 감염 징후(호흡기, 소화기) 배제',
      '말초혈액도말 검사 계획 설명',
      '항말라리아제 복용 완료 및 헌혈 금지 교육'
    ],
    attempts: 0,
    bestScore: 0,
    distribution: [0, 0, 0, 0, 0],
    avatar: '👦',
    rubrics: [
      { id: 'r1', category: '병력청취', item: '오한, 고열, 식은땀의 패턴이 48시간(이틀) 주기로 반복되는지 확인함', weight: 20, checked: false, keyword: ['주기', '이틀', '48시간', '오한', '식은땀'] },
      { id: 'r2', category: '병력청취', item: '환자의 직업(전방 근무 군인) 및 최근 모기에 물린 적이 있는지 역학력을 파악함', weight: 20, checked: false, keyword: ['군인', '전방', '철원', '모기'] },
      { id: 'r3', category: '진단계획', item: '비장 비대 및 용혈성 빈혈(결막 창백) 여부를 진찰하고 말초혈액도말 검사를 계획함', weight: 20, checked: false, keyword: ['비장', '혈액', '도말', '빈혈'] },
      { id: 'r4', category: '의사소통', item: '군대 동기를 보고 미리 걱정하는 환자에게 검사 절차를 명확히 안내하여 안심시킴', weight: 20, checked: false, keyword: ['동기', '걱정', '검사', '확실'] },
      { id: 'r5', category: '설명교육', item: '삼일열 말라리아를 설명하고, 재발 방지를 위해 약(프리마퀸 등)을 끝까지 복용해야 함을 강조함', weight: 20, checked: false, keyword: ['말라리아', '약', '끝까지', '재발'] }
    ],
    script: {
      initial: '어제 강원도 철원 GOP에서 휴가 나온 군인인데요, 5일 전부터 춥고 떨리면서 39도 고열이 나다가 땀이 쫙 나면서 열이 내려가요. 이틀 간격으로 계속 이러는데 군대 동기처럼 말라리아인가요?',
      dialogs: [],
      fallback: '열이 오를 때마다 너무 괴로워요.'
    }
  }
];

export const initialNotifications = [
  { id: 'n1', text: '의사소통 역량 루브릭(v1.2) 업데이트가 완료되었습니다.', time: '10분 전', unread: true },
  { id: 'n2', text: '김민준 환자 시나리오의 전문가 검수 코멘트가 새로 추가되었습니다.', time: '2시간 전', unread: true },
  { id: 'n3', text: '예비 의사 김하나님, 오늘 D-day 목표 학습시간까지 1시간 남았습니다.', time: '5시간 전', unread: false }
];

export const initialHistory = [];
export const initialRubricHistoryLogs = {};
export const initialExpertTimelineLogs = {};
