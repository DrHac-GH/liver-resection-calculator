document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calculator-form');
    const resultDiv = document.getElementById('result');
    const inputs = form.querySelectorAll('input, select');

    const calculateAndDisplay = () => {
        // --- 入力値の取得 ---
        const icgR15 = parseFloat(document.getElementById('icg-r15').value);
        const totalBilirubin = parseFloat(document.getElementById('total-bilirubin').value);
        const albumin = parseFloat(document.getElementById('albumin').value);
        const ptActivity = parseInt(document.getElementById('pt-activity').value);
        const ascites = document.getElementById('ascites').value;
        const ascitesEffect = document.getElementById('ascites-effect').value;
        const encephalopathy = document.getElementById('encephalopathy').value;

        let resultHtml = '';
        let childPughHtml = '', liverDamageHtml = '', makuuchiHtml = '', takasakiHtml = '';

        // --- 1. Child-Pughスコア計算 ---
        if (!isNaN(totalBilirubin) && !isNaN(albumin) && !isNaN(ptActivity) && ascites && encephalopathy) {
            let score = 0;
            if (totalBilirubin <= 2.0) score += 1; else if (totalBilirubin <= 3.0) score += 2; else score += 3;
            if (albumin >= 3.5) score += 1; else if (albumin >= 2.8) score += 2; else score += 3;
            if (ptActivity >= 70) score += 1; else if (ptActivity >= 40) score += 2; else score += 3;
            if (ascites === 'なし') score += 1; else if (ascites === '軽度') score += 2; else score += 3;
            if (encephalopathy === 'なし') score += 1; else if (encephalopathy === '軽度') score += 2; else score += 3;
            let pClass = '';
            if (score <= 6) pClass = 'A'; else if (score <= 9) pClass = 'B'; else pClass = 'C';
            childPughHtml = `<div class="result-section"><h3>Child-Pugh分類</h3><p><strong>判定:</strong> ${pClass} (${score}点)</p></div>`;
        }

        // --- 2. 肝障害度計算 ---
        if (!isNaN(icgR15) && !isNaN(totalBilirubin) && !isNaN(albumin) && !isNaN(ptActivity) && ascites) {
            const grades = {};
            if (ascites === 'なし') { grades.ascites = 'A'; } else { grades.ascites = (ascitesEffect === '治療効果あり') ? 'B' : 'C'; }
            if (totalBilirubin < 2.0) grades.bilirubin = 'A'; else if (totalBilirubin <= 3.0) grades.bilirubin = 'B'; else grades.bilirubin = 'C';
            if (albumin > 3.5) grades.albumin = 'A'; else if (albumin >= 3.0) grades.albumin = 'B'; else grades.albumin = 'C';
            if (icgR15 < 15) grades.icg = 'A'; else if (icgR15 <= 40) grades.icg = 'B'; else grades.icg = 'C';
            if (ptActivity > 80) grades.pt = 'A'; else if (ptActivity >= 50) grades.pt = 'B'; else grades.pt = 'C';
            const gradeList = Object.values(grades);
            const countA = gradeList.filter(g => g === 'A').length, countB = gradeList.filter(g => g === 'B').length, countC = gradeList.filter(g => g === 'C').length;
            let degree = '';
            if (countB >= 2 && countC >= 2) { degree = 'C'; } else if (countA === 3 && countB === 1 && countC === 1) { degree = 'B'; } else { if (countC > 0) degree = 'C'; else if (countB > 0) degree = 'B'; else degree = 'A'; }
            const details = `(腹水${grades.ascites}, T-bil${grades.bilirubin}, Alb${grades.albumin}, ICG R15 ${grades.icg}, PT${grades.pt})`;
            liverDamageHtml = `<div class="result-section"><h3>Liver damage (原発性肝癌取扱い規約)</h3><p><strong>判定:</strong> ${degree}</p><p><small>${details}</small></p></div>`;
        }

        // --- 3. 幕内基準 ---
        if (!isNaN(icgR15) && !isNaN(totalBilirubin) && ascites) {
            let result = '';
            if (ascites === '中等度以上' && ascitesEffect === '治療効果少ない') { result = '手術適応なし'; } else if (totalBilirubin >= 2.0) { result = '手術適応なし'; } else if (totalBilirubin >= 1.6) { result = '核出'; } else if (totalBilirubin >= 1.1) { result = '部分切除'; } else { if (icgR15 < 10) { result = '2区域以上切除（右肝切除、左三区域切除）'; } else if (icgR15 < 20) { result = '区域切除もしくは左肝切除'; } else if (icgR15 < 30) { result = '亜区域切除'; } else if (icgR15 < 40) { result = '部分切除'; } else { result = '核出'; } }
            makuuchiHtml = `<div class="result-section"><h3>Makuuchi criteria</h3><p>${result}</p></div>`;
        }

        // --- 4. 高崎の式 ---
        if (!isNaN(icgR15)) {
            let takasakiContent = '';
            if (icgR15 <= 0) { takasakiContent = '<p class="error">ICG R15は0より大きい値を入力してください</p>'; } else if (icgR15 >= 100) { takasakiContent = '<p class="error">ICG R15は100未満の値を入力してください</p>'; } else {
                const k_pre = -Math.log(icgR15 / 100) / 15;
                if (k_pre <= 0) { takasakiContent = '<p class="error">計算エラー: K値が0以下です</p>'; } else {
                    const calculateResectionRate = (T) => { const r_min = -Math.log(T / 100) / (k_pre * 15); const rate = Math.max(0, Math.min(1, 1 - r_min)) * 100; return rate.toFixed(1); };
                    const normalLiverRate = calculateResectionRate(50);
                    const cirrhoticLiverRate = calculateResectionRate(40);
                    let normalLiverHtml = `正常肝　許容切除率：${normalLiverRate}％`;
                    if (parseFloat(normalLiverRate) === 0.0) { normalLiverHtml += ' <small>（安全域外／切除不可）</small>'; }
                    let cirrhoticLiverHtml = `硬変肝　許容切除率：${cirrhoticLiverRate}％`;
                    if (parseFloat(cirrhoticLiverRate) === 0.0) { cirrhoticLiverHtml += ' <small>（安全域外／切除不可）</small>'; }
                    takasakiContent = `<p>${normalLiverHtml}</p><p>${cirrhoticLiverHtml}</p>`;
                    if (icgR15 < 0.1) { takasakiContent += '<p><small>注: 非常に低いR15値のため、理論上の許容切除率が過大評価される可能性があります。</small></p>'; }
                }
            }
            takasakiHtml = `<div class="result-section"><h3>高崎の式</h3>${takasakiContent}</div>`;
        }

        // --- 5. 結果の表示 ---
        resultHtml = childPughHtml + liverDamageHtml + takasakiHtml + makuuchiHtml;
        if (resultHtml) {
            resultDiv.innerHTML = `<h2>評価結果</h2>` + resultHtml;
        } else {
            resultDiv.innerHTML = '';
        }
    };

    // 各入力フィールドにイベントリスナーを設定
    inputs.forEach(input => {
        input.addEventListener('input', calculateAndDisplay);
    });

    // 腹水の表示制御は別途残す
    const ascitesSelect = document.getElementById('ascites');
    const ascitesEffectGroup = document.getElementById('ascites-effect-group');
    ascitesSelect.addEventListener('change', () => {
        ascitesEffectGroup.style.display = (ascitesSelect.value === '軽度' || ascitesSelect.value === '中等度以上') ? 'block' : 'none';
        // 腹水の変更でも再計算
        calculateAndDisplay();
    });

    // 初期表示（空のはず）
    calculateAndDisplay();
});