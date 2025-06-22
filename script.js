const API_BASE = "https://8883-106-160-31-181.ngrok-free.app/api"
const FIXED_PAYPAY_URL = "https://qr.paypay.ne.jp/p2p01_diJqPHre1YDTtzKA"
document.addEventListener("DOMContentLoaded", () => {
  let products = [];
  let cart = [];
  let tsumList = [];
  let setInCart = null;
  let boxTypesInCart = new Set();
  let purchaseHistory = [];
  let currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  let currentSetConfig = null;
  let currentTsumSelection = null;
  let currentSetStep = 1;
  let totalSetSteps = 0;
  let lineCodeVerified = false;
  initializeTheme();
  loadTsumList();
  loadProducts();
  document.getElementById("paymentTransactionFields").style.display = "none";
  document.getElementById("confirmPurchaseButton").style.display = "none";
  
  function loadTsumList() {
    fetch("tsumlist.json")
      .then(response => {
        if (!response.ok) {
          throw new Error("ツムリストの読み込みに失敗しました");
        }
        return response.json();
      })
      .then(data => {
        tsumList = data;
      })
      .catch(error => {
        console.error("ツムリストの読み込みエラー:", error);
      });
  }

  function loadProducts() {
    fetch("products.json")
      .then(response => {
        if (!response.ok) {
          throw new Error("商品データの読み込みに失敗しました");
        }
        return response.json();
      })
      .then(data => {
        products = data;
        renderProducts();
        initializeEventListeners();
        loadCartFromStorage();
        loadSettings();
        updateStats();
      })
      .catch(error => {
        console.error("商品データの読み込みエラー:", error);
        showNotification("エラー", "商品データの読み込みに失敗しました。ページを再読み込みしてください。");
        document.querySelectorAll('.shop-loading').forEach(el => {
          el.innerHTML = `
            <div class="load-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>商品データの読み込みに失敗しました</p>
              <button class="retry-button" onclick="location.reload()">再試行</button>
            </div>
          `;
        });
      });
  }

  function initializeTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('tsumTsumDarkMode');
    const isDarkMode = storedTheme === null ? prefersDark : storedTheme === 'true';
    
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    document.body.classList.toggle('dark-mode', isDarkMode);
    currentTheme = isDarkMode ? 'dark' : 'light';
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (localStorage.getItem('tsumTsumDarkMode') === null) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        document.body.classList.toggle('dark-mode', e.matches);
        currentTheme = newTheme;
        updateProductIcons();
      }
    });
  }

  function renderProducts() {
    const setProductsContainer = document.getElementById("set-products");
    const singleProductsContainer = document.getElementById("single-products");

    setProductsContainer.innerHTML = "";
    singleProductsContainer.innerHTML = "";

    products.forEach((product) => {
      const productHTML = createProductHTML(product);

      if (product.type === "set") {
        setProductsContainer.innerHTML += productHTML;
      } else {
        singleProductsContainer.innerHTML += productHTML;
      }
    });

    initializeProductEventListeners();
    updateProductIcons();
  }

  function createProductHTML(product) {
    let optionsHTML = "";

    product.options.forEach((option) => {
      const optionDescription = option.label === "パックタイプ" ? "1つのみ選択可能です" : "";
      const placeholder = option.customPlaceholder 
      || (product.id === "coin" ? "コイン数を入力 (10000〜)" 
      : product.id === "プレラン" ? "レベルを入力 (1〜1100)" 
      : product.id === "score" ? "スコアを入力 (10000〜)" 
      : "");
      
      optionsHTML += `
        <div class="shop-item-options">
          <div class="option-label">${option.label}</div>
          ${optionDescription ? `<div class="option-description">${optionDescription}</div>` : ''}
          <div class="option-buttons">
            ${option.choices
              .filter(choice => choice.label !== "")
              .map(
                (choice, index) => `
                <div class="option-button ${index === 0 ? "selected" : ""}" 
                  data-value="${choice.value}" 
                  data-price="${choice.price}">
                  ${choice.label}
                </div>
              `
              )
              .join("")}
          </div>
          ${
            option.hasCustom
              ? `
              <div class="custom-amount" ${option.choices[0].value === "custom" ? 'style="display: block;"' : ''}>
                <input type="number" class="form-input custom-amount-input" 
                  placeholder="${placeholder}" 
                  min="${option.customMin}" 
                  ${option.customMax ? `max="${option.customMax}"` : ""} 
                  step="${option.customStep || 1}"
                  ${product.id === "プレラン" ? 'max="1100"' : ''}>
              </div>
            `
              : ""
          }
        </div>
      `;
    });

    return `
      <div class="shop-item" data-id="${product.id}" data-type="${product.type}">
        <div class="shop-item-header">
          <div class="shop-item-info">
            <div class="shop-item-icon" data-product-id="${product.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${product.icon}
              </svg>
            </div>
            <div>
              <div class="shop-item-title">${product.name}</div>
            </div>
          </div>
          <div class="shop-item-price">${product.priceRange}</div>
        </div>
        <div class="shop-item-description">
          ${product.description}
        </div>
        ${optionsHTML}
        <div class="shop-item-action">
          <div class="shop-item-subtotal">小計: <span>¥${product.basePrice.toLocaleString()}</span></div>
          <button class="add-to-cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            カートに追加
          </button>
        </div>
      </div>
    `;
  }

  function updateProductIcons() {
    products.forEach(product => {
      const icons = document.querySelectorAll(`.shop-item-icon[data-product-id="${product.id}"]`);
      if (product.theme && product.theme[currentTheme]) {
        const bgColor = product.theme[currentTheme].iconBg;
        icons.forEach(icon => {
          icon.style.backgroundColor = bgColor;
        });
      }
    });
  }

  function initializeProductEventListeners() {
    const optionButtons = document.querySelectorAll(".option-button");
    optionButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const optionGroup = this.closest(".shop-item-options");
        const optionButtons = optionGroup.querySelectorAll(".option-button");
        const customField = optionGroup.querySelector(".custom-amount");

        optionButtons.forEach((btn) => btn.classList.remove("selected"));
        this.classList.add("selected");

        if (customField) {
          if (this.getAttribute("data-value") === "custom") {
            customField.style.display = "block";
            customField.classList.add("highlight");
            setTimeout(() => {
              customField.querySelector('input').focus();
            }, 100);
          } else {
            customField.style.display = "none";
            customField.classList.remove("highlight");
          }
        }

        updateSubtotal(this.closest(".shop-item"));
      });
    });

    const customInputs = document.querySelectorAll(".custom-amount-input");
    customInputs.forEach((input) => {
      input.addEventListener("input", function () {
        updateSubtotal(this.closest(".shop-item"));
      });
    });

    const addToCartButtons = document.querySelectorAll(".add-to-cart");
    addToCartButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const shopItem = this.closest(".shop-item");
        const itemId = shopItem.getAttribute("data-id");
        const itemType = shopItem.getAttribute("data-type");
        const itemName = shopItem.querySelector(".shop-item-title").textContent;

        if (itemType === "set") {
          if (this.classList.contains("in-cart")) {
            const index = cart.findIndex(item => item.id === itemId);
            if (index !== -1) {
              removeFromCart(index);
            }
            return;
          }

          if (setInCart) {
            showNotification("エラー", "セット商品は1回の会計で1つまでしか購入できません。");
            return;
          }

          openSetConfigOverlay(itemId);
          return;
        }
        
        if (itemId === "ツムレベ") {
          openTsumSelectOverlay(itemId, itemName);
          return;
        }
        
        if (itemType === "single" && setInCart) {
           const setCartItem = cart.find(item => item.id === setInCart);
           if (
              setCartItem &&
              setCartItem.contents?.some(c => c.id === itemId) &&
                itemId !== "ツムレベ"
              ) {
                showNotification("エラー", "セット商品に含まれる商品は同時に購入できません。");
                return;
              }
            }

        if (this.classList.contains("in-cart")) {
          const index = cart.findIndex(item => item.id === itemId);
          if (index !== -1) {
            removeFromCart(index);
            this.classList.remove("in-cart");
            this.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              カートに追加
            `;
            return;
          }
        }

        if (itemType === "box") {
          const selectedOption = shopItem.querySelector(".option-button.selected");
          const boxType = selectedOption ? selectedOption.getAttribute("data-value") : "";
          if (boxTypesInCart.has(boxType)) {
            showNotification("エラー", "同じタイプのBOXは1回の会計で1つまでしか購入できません。");
            return;
          }
        }

        const options = [];
        let amount = null;

shopItem.querySelectorAll(".shop-item-options").forEach((optionGroup) => {
  const selectedOption = optionGroup.querySelector(".option-button.selected");
  const customInput    = optionGroup.querySelector(".custom-amount-input");
  const labelText      = optionGroup.querySelector(".option-label").textContent;

  if (selectedOption) {
    let optionValue = selectedOption.getAttribute("data-value");
    let optionText  = selectedOption.textContent.trim();

    if (optionValue === "custom") {
      if (customInput && customInput.value) {
        const v = Number.parseInt(customInput.value, 10);
        if (itemId === "プレラン" && v > 1100) {
          showNotification("エラー", "プレイヤーレベルは1100までしか指定できません。");
          customInput.classList.add("input-error");
          return;
        }
        if (itemId === "coin" && v < 10000) {
          showNotification("エラー", "コイン数は10,000以上で指定してください。");
          customInput.classList.add("input-error");
          return;
        }
        optionValue = customInput.value;
        optionText  = customInput.value;
        amount      = v;
      } else {
        showNotification("エラー", "数値を入力してください。");
        return;
      }
    }

    options.push({ label: labelText, value: optionValue, text: optionText });
  } else if (customInput && customInput.value) {
    const v = Number.parseInt(customInput.value, 10);
    if (itemId === "プレラン" && v > 1100) {
      showNotification("エラー", "プレイヤーレベルは1100までしか指定できません。");
      customInput.classList.add("input-error");
      return;
    }
    if (itemId === "coin" && v < 10000) {
      showNotification("エラー", "コイン数は10,000以上で指定してください。");
      customInput.classList.add("input-error");
      return;
    }
    amount = v;
    options.push({
      label: labelText,
      value: customInput.value,
      text:  customInput.value,
    });
  }
});
        const subtotalText = shopItem.querySelector(".shop-item-subtotal span").textContent;
        const subtotal = Number.parseInt(subtotalText.replace(/[^0-9]/g, ""));
        console.log(amount);
        addToCart(itemId, itemType, itemName, options, 1, subtotal, amount);
        showNotification("カートに追加", `${itemName}をカートに追加しました。`);

        this.classList.add("in-cart");
        this.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          キャンセル
        `;
      });
    });
  }

  function updateSubtotal(shopItem) {
    if (!shopItem) return;

    const selectedOptions = shopItem.querySelectorAll(".option-button.selected");
    if (selectedOptions.length === 0) return;

    let basePrice = 0;

    selectedOptions.forEach((option) => {
      if (option.getAttribute("data-value") === "custom") {
        const customInput = option.closest(".shop-item-options").querySelector(".custom-amount-input");
        if (customInput && customInput.value) {
          const itemId = shopItem.getAttribute("data-id");
          const customValue = Number.parseInt(customInput.value);

          if (itemId === "coin") {
            basePrice += Math.ceil(customValue / 10000) * 300;
          } else if (itemId === "プレラン") {
            basePrice += 300;
          } else if (itemId === "ツムレベ") {
            basePrice += 200; 
          } else if (itemId === "score") {
            basePrice += 500;
          }
        }
      } else {
        basePrice += Number.parseInt(option.getAttribute("data-price"));
      }
    });

    const quantity = 1;
    const subtotal = basePrice * quantity;

    shopItem.querySelector(".shop-item-subtotal span").textContent = `¥${subtotal.toLocaleString()}`;
  }

  function openSetConfigOverlay(setId) {
    const setProduct = products.find(p => p.id === setId);
    if (!setProduct) return;
    
    currentSetConfig = {
      id: setId,
      name: setProduct.name,
      type: "set",
      contents: [],
      price: setProduct.basePrice,
      options: []
    };
    
    const setConfigContent = document.getElementById("setConfigContent");
    const setConfigTitle = document.getElementById("setConfigTitle");
    const setConfigStepsIndicator = document.getElementById("setConfigStepsIndicator");
    
    setConfigTitle.textContent = `${setProduct.name}の内容指定`;
    
    let contentHTML = '';
    let stepIndex = 1;
    
    setProduct.contents.forEach(contentId => {
      const contentProduct = products.find(p => p.id === contentId);
      if (!contentProduct) return;
      
      contentHTML += `
        <div class="set-config-step" data-content-id="${contentId}" data-step="${stepIndex}">
          <div class="set-config-step-header">
            <div class="set-config-step-number">${stepIndex}</div>
            <div class="set-config-step-title">${contentProduct.name}</div>
          </div>
          <div class="set-config-form-group">
      `;
      
      if (contentId === "coin") {
        contentHTML += `
          <label class="set-config-label">コイン数を指定</label>
          <div class="set-config-description">10,000コイン単位で指定できます</div>
          <input type="number" class="set-config-input" id="set-coin-amount" 
            min="10000" max="2147483647" step="10000" value="10000" placeholder="コイン数を入力 (10,000〜)">
        `;
      } else if (contentId === "プレラン") {
        contentHTML += `
          <label class="set-config-label">プレイヤーレベルを指定</label>
          <div class="set-config-description">最大レベル1100まで指定できます</div>
          <input type="number" class="set-config-input" id="set-player-level" 
            min="1" max="1100" value="1" placeholder="レベルを入力 (1〜1100)">
        `;
      } else if (contentId === "score") {
        contentHTML += `
          <label class="set-config-label">スコアを指定</label>
          <div class="set-config-description">100万点単位で指定できます</div>
          <input type="number" class="set-config-input" id="set-score-amount" 
            min="1000000" step="1000000" value="1000000" placeholder="スコアを入力 (100万〜)">
        `;
      } else if (contentId === "ツムレベ") {
        contentHTML += `
          <label class="set-config-label">ツムを選択</label>
          <div class="set-config-description">レベルアップさせたいツムを選択してください</div>
          <div class="set-config-tsum-selection">
            <button class="set-config-tsum-button" id="set-tsum-select-button">
              ツムを選択
            </button>
            <div class="set-config-tsum-list" id="set-tsum-list">
              <div class="set-config-tsum-empty">ツムが選択されていません</div>
            </div>
          </div>
        `;
      } else {
        contentHTML += `
          <div class="set-config-form-group">
            <div class="set-config-label">${contentProduct.name}</div>
            <div class="set-config-description">このアイテムはセットに含まれています</div>
            <div class="set-config-value">含まれています</div>
          </div>
        `;
      }
      
      contentHTML += `
          </div>
        </div>
      `;
      
      stepIndex++;
    });
    
    contentHTML += `
      <div class="set-config-step" data-step="${stepIndex}">
        <div class="set-config-step-header">
          <div class="set-config-step-number">${stepIndex}</div>
          <div class="set-config-step-title">確認</div>
        </div>
        <div class="set-config-summary">
          <div class="set-config-summary-title">セット内容</div>
          <div id="set-config-summary-content"></div>
        </div>
      </div>
    `;
    
    setConfigContent.innerHTML = contentHTML;
    
    totalSetSteps = stepIndex;
    currentSetStep = 1;
    
    let indicatorsHTML = '';
    for (let i = 1; i <= totalSetSteps; i++) {
      indicatorsHTML += `<div class="step-indicator ${i === 1 ? 'active' : ''}" data-step="${i}"></div>`;
    }
    setConfigStepsIndicator.innerHTML = indicatorsHTML;
    
    document.querySelector('.set-config-step[data-step="1"]').classList.add('active');
    
    const tsumSelectButton = document.getElementById("set-tsum-select-button");
    if (tsumSelectButton) {
      tsumSelectButton.addEventListener("click", () => {
        openTsumSelectOverlay("ツムレベ", "ツムレベル", true);
      });
    }
    
    const setConfigBackButton = document.getElementById("setConfigBackButton");
    const setConfigConfirmButton = document.getElementById("setConfigConfirmButton");
    const setConfigCloseButton = document.getElementById("setConfigClose");
    
    setConfigBackButton.addEventListener("click", () => {
      if (currentSetStep > 1) {
        navigateSetConfigStep(currentSetStep - 1);
      } else {
        closeSetConfigOverlay();
      }
    });

    if (!setConfigConfirmButton.dataset.bound) {
      setConfigConfirmButton.dataset.bound = "1";
      setConfigConfirmButton.addEventListener("click", () => {
        const activeStep = document.querySelector('.set-config-step.active');
        const contentId = activeStep.getAttribute('data-content-id');
        
        if (contentId) {
          if (contentId === "coin") {
            const coinAmount = Number.parseInt(document.getElementById("set-coin-amount").value);
            if (isNaN(coinAmount) || coinAmount < 10000) {
              showNotification("エラー", "コイン数は10,000以上で指定してください。");
              document.getElementById("set-coin-amount").classList.add("input-error");
              return;
            }
            
            currentSetConfig.contents.push({
              id: "coin",
              name: "コイン",
              amount: coinAmount
            });
          } else if (contentId === "プレラン") {
            const playerLevel = Number.parseInt(document.getElementById("set-player-level").value);
            if (isNaN(playerLevel) || playerLevel < 1 || playerLevel > 1100) {
              showNotification("エラー", "プレイヤーレベルは1〜1100で指定してください。");
              document.getElementById("set-player-level").classList.add("input-error");
              return;
            }

            currentSetConfig.contents.push({
              id: "プレラン",
              name: "プレイヤーレベル",
              amount: playerLevel
            });
          } else if (contentId === "score") {
            const scoreAmount = Number.parseInt(document.getElementById("set-score-amount").value);
            if (isNaN(scoreAmount) || scoreAmount < 1000000) {
              showNotification("エラー", "スコアは1,000,000以上で指定してください。");
              document.getElementById("set-score-amount").classList.add("input-error");
              return;
            }
            
            currentSetConfig.contents.push({
              id: "score",
              name: "スコア",
              amount: scoreAmount
            });
          } else if (contentId === "ツムレベ") {
            if (currentSetConfig.contents.filter(c => c.id === "ツムレベ").length === 0) {
              showNotification("エラー", "ツムを選択してください。");
              return;
            }
          } else {
            const contentProduct = products.find(p => p.id === contentId);
            if (contentProduct) {
              currentSetConfig.contents.push({
                id: contentId,
                name: contentProduct.name
              });
            }
          }
        }
        
        if (currentSetStep < totalSetSteps) {
          navigateSetConfigStep(currentSetStep + 1);
        } else {
          addSetToCart();
          closeSetConfigOverlay();
        }
      });
    }
    
    setConfigCloseButton.addEventListener("click", closeSetConfigOverlay);
    
    document.getElementById("setConfigOverlay").classList.add("open");
  }

  function navigateSetConfigStep(stepNumber) {
    document.querySelector(`.set-config-step.active`).classList.remove('active');
    
    document.querySelector(`.set-config-step[data-step="${stepNumber}"]`).classList.add('active');
    
    document.querySelectorAll('.step-indicator').forEach(indicator => {
      indicator.classList.remove('active');
    });
    document.querySelector(`.step-indicator[data-step="${stepNumber}"]`).classList.add('active');
    
    currentSetStep = stepNumber;
    
    const setConfigConfirmButton = document.getElementById("setConfigConfirmButton");
    if (stepNumber === totalSetSteps) {
      updateSetConfigSummary();
      setConfigConfirmButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        確定
      `;
    } else {
      setConfigConfirmButton.innerHTML = `次へ`;
    }
  }
  
  function updateSetConfigSummary() {
    const summaryContent = document.getElementById("set-config-summary-content");
    let html = '';
    
    currentSetConfig.contents.forEach(content => {
      if (content.id === "ツムレベ" && content.tsumId) {
        const tsumName = getTsumNameById(content.tsumId);
        html += `
          <div class="set-config-summary-item">
            <div class="set-config-summary-label">${content.name}</div>
            <div class="set-config-summary-value">${tsumName} (Lv.${content.level})</div>
          </div>
        `;
      } else if (content.amount) {
        html += `
          <div class="set-config-summary-item">
            <div class="set-config-summary-label">${content.name}</div>
            <div class="set-config-summary-value">${content.amount.toLocaleString()}</div>
          </div>
        `;
      } else {
        html += `
          <div class="set-config-summary-item">
            <div class="set-config-summary-label">${content.name}</div>
            <div class="set-config-summary-value">含む</div>
          </div>
        `;
      }
    });
    
    html += `
      <div class="set-config-summary-item">
        <div class="set-config-summary-label">合計</div>
        <div class="set-config-summary-value">¥${currentSetConfig.price.toLocaleString()}</div>
      </div>
    `;
    
    summaryContent.innerHTML = html;
  }
  
  function closeSetConfigOverlay() {
    document.getElementById("setConfigOverlay").classList.remove("open");
    setTimeout(() => {
      document.getElementById("setConfigContent").innerHTML = '';
      document.getElementById("setConfigStepsIndicator").innerHTML = '';
      currentSetConfig = null;
      currentSetStep = 1;
      totalSetSteps = 0;
    }, 300);
  }
  
  function addSetToCart() {
    if (!currentSetConfig) return;
    
    const conflicting = cart.find(it =>
    it.type === "single" &&
    currentSetConfig.contents.includes(it.id) &&
    it.id !== "ツムレベ"
     );
    if (conflicting) {
       showNotification("エラー",
       `${conflicting.name} がカートにあるため、このセットは追加できません。`);
       return;
    }

  
    const setProduct = products.find(p => p.id === currentSetConfig.id);
    if (!setProduct) return;
    
    const options = [];
    currentSetConfig.contents.forEach(content => {
      if (content.id === "ツムレベ" && content.tsumId) {
        const tsumName = getTsumNameById(content.tsumId);
        options.push({
          label: "ツムレベル",
          value: `${content.tsumId}:${content.level}`,
          text: `${tsumName} (Lv.${content.level})`
        });
      } else if (content.amount) {
        options.push({
          label: content.name,
          value: content.amount.toString(),
          text: content.amount.toLocaleString()
        });
      }
    });
    
    addToCart(
      currentSetConfig.id,
      "set",
      setProduct.name,
      options,
      1,
      currentSetConfig.price,
      null,
      currentSetConfig.contents
    );
    
    const button = document.querySelector(`.shop-item[data-id="${currentSetConfig.id}"] .add-to-cart`);
    if (button) {
      button.classList.add("in-cart");
      button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>キャンセル
      `;
    }
    
    showNotification("カートに追加", `${setProduct.name}をカートに追加しました。`);
  }
  
  function openTsumSelectOverlay(itemId, itemName, isForSet = false) {
    currentTsumSelection = {
      id: itemId,
      name: itemName,
      isForSet: isForSet,
      tsumId: null,
      tsumName: null,
      level: 1
    };
   
    document.getElementById("tsumSearchInput").value = "";
    document.getElementById("tsumSearchResults").innerHTML = "";
    document.getElementById("tsumSearchResults").classList.remove("show");
    document.getElementById("selectedTsumName").textContent = "未選択";
    document.getElementById("selectedTsumId").value = "";
    document.getElementById("tsumSelectConfirmButton").disabled = true;
    updateTsumLimitIndicator();
    
    const tsumSearchInput = document.getElementById("tsumSearchInput");
    const tsumSearchResults = document.getElementById("tsumSearchResults");
    const tsumSelectConfirmButton = document.getElementById("tsumSelectConfirmButton");
    const tsumSelectCancelButton = document.getElementById("tsumSelectCancelButton");
    const tsumSelectCloseButton = document.getElementById("tsumSelectClose");
    
    tsumSearchInput.addEventListener("input", function() {
      const searchTerm = this.value.trim();
      if (searchTerm.length < 1) {
        tsumSearchResults.innerHTML = "";
        tsumSearchResults.classList.remove("show");
        return;
      }
      
      const results = tsumList.filter(tsum => 
        tsum.name.includes(searchTerm) && tsum.id !== ""
      ).slice(0, 10);
      
      if (results.length > 0) {
        let html = '';
        results.forEach(tsum => {
          html += `<div class="tsum-search-item" data-tsum-id="${tsum.id}" data-tsum-name="${tsum.name}">${tsum.name}</div>`;
        });
        tsumSearchResults.innerHTML = html;
        tsumSearchResults.classList.add("show");
        
        document.querySelectorAll(".tsum-search-item").forEach(item => {
          item.addEventListener("click", function() {
            const tsumId = this.getAttribute("data-tsum-id");
            const tsumName = this.getAttribute("data-tsum-name");
            
            if (isTsumAlreadySelected(tsumId)) {
              showNotification("エラー", "このツムは既に選択されています。");
              return;
            }
            
            document.getElementById("selectedTsumName").textContent = tsumName;
            document.getElementById("selectedTsumId").value = tsumId;
            tsumSearchResults.classList.remove("show");
            tsumSearchInput.value = "";
            tsumSelectConfirmButton.disabled = false;
            
            currentTsumSelection.tsumId = tsumId;
            currentTsumSelection.tsumName = tsumName;
          });
        });
      } else {
        tsumSearchResults.innerHTML = "<div class='tsum-search-item'>該当するツムがありません</div>";
        tsumSearchResults.classList.add("show");
      }
    });
    
    tsumSelectConfirmButton.addEventListener("click", () => {
      if (currentTsumSelection.isForSet && currentSetConfig) {
        const limit = currentSetConfig.id === "set-b" ? 3 :
                currentSetConfig.id === "set-c" ? 5 : 1;
        const selected = currentSetConfig.contents.filter(c => c.id === "ツムレベ").length;
        if (selected >= limit) {
          showNotification("エラー", `このセットではツムを最大 ${limit} 体まで選択できます。`);
          return;
        }
      }

      if (!currentTsumSelection.tsumId) {
        showNotification("エラー", "ツムを選択してください。");
        return;
      }
      
      const level = 50;
      currentTsumSelection.level = level;
      
      if (currentTsumSelection.isForSet) {
        currentSetConfig.contents.push({
          id: "ツムレベ",
          name: "ツムレベル",
          tsumId: currentTsumSelection.tsumId,
          tsumName: currentTsumSelection.tsumName,
          level: currentTsumSelection.level
        });
        
        const item = document.createElement("div");
        item.className = "set-config-tsum-item";
        item.dataset.tsumId = currentTsumSelection.tsumId;
        item.innerHTML = `
          ${currentTsumSelection.tsumName} (Lv.${currentTsumSelection.level})
          <span class="tsum-remove">×</span>
        `;
        
        const listEl = document.getElementById("set-tsum-list");
        const empty = listEl.querySelector(".set-config-tsum-empty");
        if (empty) empty.remove();
        listEl.appendChild(item);
        updateTsumLimitIndicator();
        
        if (!listEl.dataset.bound) {
          listEl.dataset.bound = "1";
          listEl.addEventListener("click", e => {
            const removeBtn = e.target.closest(".tsum-remove");
            if (!removeBtn) return;
            
            const item = removeBtn.closest(".set-config-tsum-item");
            if (!item) return;

            const tsumId = item.dataset.tsumId;

            const idx = currentSetConfig.contents.findIndex(
              c => c.tsumId?.toString() === tsumId
            );
            if (idx !== -1) currentSetConfig.contents.splice(idx, 1);

            item.remove();
            updateTsumLimitIndicator();
            if (listEl.children.length === 0) {
              listEl.innerHTML =
                "<div class='set-config-tsum-empty'>ツムが選択されていません</div>";
            }
          });
        }
        
        closeTsumSelectOverlay();
      } else {
        const price = 200;
        const options = [
          {
            label: "ツム",
            value: currentTsumSelection.tsumId,
            text: currentTsumSelection.tsumName
          },
          {
            label: "レベル",
            value: level.toString(),
            text: level.toString()
          }
        ];
        
        addToCart(
          "ツムレベ",
          "single",
          "ツムレベル",
          options,
          1,
          price,
          null,
          [{
            id: "ツムレベ",
            tsumId: currentTsumSelection.tsumId,
            tsumName: currentTsumSelection.tsumName,
            level: level
          }]
        );
        
        showNotification("カートに追加", `ツムレベル (${currentTsumSelection.tsumName})をカートに追加しました。`);
        closeTsumSelectOverlay();
      }
    }, { once: true });
    
    tsumSelectCancelButton.addEventListener("click", closeTsumSelectOverlay);
    tsumSelectCloseButton.addEventListener("click", closeTsumSelectOverlay);
    
    document.getElementById("tsumSelectOverlay").classList.add("open");
  }
  
  function closeTsumSelectOverlay() {
    document.getElementById("tsumSelectOverlay").classList.remove("open");
    setTimeout(() => {
      currentTsumSelection = null;
    }, 300);
  }
  
  function getTsumNameById(id) {
    const tsum = tsumList.find(t => t.id.toString() === id.toString());
    return tsum ? tsum.name : "不明なツム";
  }
  
  function isTsumAlreadySelected(tsumId) {
    for (const item of cart) {
      if (item.contents) {
        for (const content of item.contents) {
          if (content.tsumId && content.tsumId.toString() === tsumId.toString()) {
            return true;
          }
        }
      }
    }
    
    if (currentSetConfig && currentSetConfig.contents) {
      for (const content of currentSetConfig.contents) {
        if (content.tsumId && content.tsumId.toString() === tsumId.toString()) {
          return true;
        }
      }
    }
    
    return false;
  }

  function addToCart(id, type, name, options, quantity, price, amount = null, contents = null) {
    if (type === "set") {
      if (setInCart) {
        showNotification("エラー", "セット商品は1回の会計で1つまでしか購入できません。");
        return false;
      }
      setInCart = id;
    }

    if (type === "box" && options.length > 0) {
      boxTypesInCart.add(options[0].value);
    }

    const cartItem = {
      id,
      type,
      name,
      options,
      quantity,
      price,
      amount,
      contents
    };

    cart.push(cartItem);
    updateCartDisplay();
    saveCartToStorage();

    return true;
  }

  function removeFromCart(index) {
    const item = cart[index];
    
    if (item.type === "set") {
      setInCart = null;
    } else if (item.type === "box" && item.options.length > 0) {
      boxTypesInCart.delete(item.options[0].value);
    }

    cart.splice(index, 1);
    updateCartDisplay();
    saveCartToStorage();
    
    const button = document.querySelector(`.shop-item[data-id="${item.id}"] .add-to-cart`);
    if (button) {
      button.classList.remove("in-cart");
      button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        カートに追加
      `;
    }
  }

  function updateCartDisplay() {
    const cartItems = document.getElementById("cartItems");
    const cartCount = document.querySelector(".cart-count");
    const cartTotal = document.getElementById("cartTotal");
    const checkoutButton = document.getElementById("checkoutButton");

    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;

    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 3rem; height: 3rem; color: var(--text-secondary); margin: 0 auto 1rem;">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <p style="color: var(--text-secondary);">カートは空です</p>
        </div>
      `;
      cartTotal.textContent = "¥0";
      checkoutButton.disabled = true;
      return;
    }

    let html = "";
    let total = 0;

    cart.forEach((item, index) => {
      total += item.price;

      let optionsHtml = "";
      
      item.options.forEach((option) => {
       if (option.label === "数量" 
       || option.label === "レベル" 
      || option.label === "スコア") return;
      optionsHtml += `<div class="cart-item-option">${option.label}: ${option.text}</div>`;
     });
    if (item.amount != null) {
     const quantityLabel = item.options[0]?.label || "数量";
      optionsHtml += `<div class="cart-item-option">${quantityLabel}: ${item.amount.toLocaleString()}</div>`;
       }
      
      let contentsHtml = "";
      if (item.contents && item.contents.length > 0) {
        contentsHtml = `
          <div class="cart-item-details-expanded" style="display: none;">
            <div class="cart-item-content">
              <div class="cart-item-content-title">内容:</div>
              <div class="cart-item-content-list">
        `;
        
        item.contents.forEach(content => {
          if (content.tsumId) {
            contentsHtml += `
              <div class="cart-item-tsum">
                <div class="cart-item-tsum-name">${content.tsumName || getTsumNameById(content.tsumId)}</div>
                <div class="cart-item-tsum-level">Lv.${content.level}</div>
              </div>
            `;
          } else if (content.amount) {
            contentsHtml += `
              <div class="cart-item-content-item">
                <div>${content.name}:</div>
                <div>${content.amount.toLocaleString()}</div>
              </div>
            `;
          } else {
            contentsHtml += `
              <div class="cart-item-content-item">
                <div>${content.name}</div>
                <div>含む</div>
              </div>
            `;
          }
        });
        
        contentsHtml += `
              </div>
            </div>
          </div>
          <button class="cart-item-toggle" data-index="${index}">
            詳細を表示
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        `;
      }

      html += `
        <div class="cart-item">
          <div class="cart-item-image">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${getItemIcon(item.id)}
            </svg>
          </div>
          <div class="cart-item-details">
            <div class="cart-item-title">${item.name}</div>
            ${optionsHtml}
            <div class="cart-item-price">¥${item.price.toLocaleString()}</div>
            <div class="cart-item-quantity">
              <div class="cart-item-quantity-label">数量:</div>
              <div class="cart-item-quantity-value">${item.quantity}</div>
            </div>
            ${contentsHtml}
          </div>
          <button class="cart-item-remove" data-index="${index}" aria-label="削除">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;
    });

    cartItems.innerHTML = html;
    cartTotal.textContent = `¥${total.toLocaleString()}`;
    checkoutButton.disabled = false;

    cartItems.querySelectorAll(".cart-item-remove").forEach((button) => {
      button.addEventListener("click", function () {
        const index = Number.parseInt(this.getAttribute("data-index"));
        removeFromCart(index);
      });
    });
    
    cartItems.querySelectorAll(".cart-item-toggle").forEach((button) => {
      button.addEventListener("click", function () {
        const index = Number.parseInt(this.getAttribute("data-index"));
        const detailsEl = this.previousElementSibling;
        
        if (detailsEl.style.display === "none") {
          detailsEl.style.display = "block";
          this.classList.add("expanded");
          this.innerHTML = `
            詳細を隠す
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          `;
        } else {
          detailsEl.style.display = "none";
          this.classList.remove("expanded");
          this.innerHTML = `
            詳細を表示
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          `;
        }
      });
    });
  }

  function getItemIcon(id) {
    const product = products.find(p => p.id === id);
    if (product && product.icon) {
      return product.icon;
    }
    
    switch (id) {
      case "coin":
        return `
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M16 8v8"></path>
          <path d="M12 12v4"></path>
          <path d="M8 8v8"></path>
        `;
      case "プレラン":
        return `
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        `;
      case "ツムレベ":
        return `
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
          <path d="M8.5 8.5v.01"></path>
          <path d="M16 15.5v.01"></path>
          <path d="M12 12v.01"></path>
          <path d="M11 17v.01"></path>
          <path d="M7 14v.01"></path>
        `;
      case "score":
        return `
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z"></path>
          <path d="M16 8h.01"></path>
          <path d="M8 8h.01"></path>
          <path d="M8 16h.01"></path>
          <path d="M16 16h.01"></path>
          <path d="M12 12h.01"></path>
        `;
      case "premium-box":
      case "happiness-box":
      case "select-box":
        return `
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        `;
      default:
        if (id.startsWith("set-")) {
          return `
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          `;
        }
        return `<circle cx="12" cy="12" r="10"></circle>`;
    }
  }

  function saveCartToStorage() {
    localStorage.setItem("tsumTsumCart", JSON.stringify(cart));
    localStorage.setItem("tsumTsumSetInCart", setInCart);
    localStorage.setItem("tsumTsumBoxTypesInCart", JSON.stringify([...boxTypesInCart]));
  }

  function loadCartFromStorage() {
    const savedCart = localStorage.getItem("tsumTsumCart");
    const savedSetInCart = localStorage.getItem("tsumTsumSetInCart");
    const savedBoxTypes = localStorage.getItem("tsumTsumBoxTypesInCart");
    const savedSelectedTsums = localStorage.getItem("tsumTsumSelectedTsums");
    
    if (savedCart) {
      cart = JSON.parse(savedCart);
    }

    if (savedSetInCart && savedSetInCart !== "null") {
      setInCart = savedSetInCart;
    }

    if (savedBoxTypes) {
      boxTypesInCart = new Set(JSON.parse(savedBoxTypes));
    }

    updateCartDisplay();

    cart.forEach(item => {
      const button = document.querySelector(`.shop-item[data-id="${item.id}"] .add-to-cart`);
      if (button) {
        const itemId = button.closest('.shop-item')?.dataset.id;
        if (itemId !== "ツムレベ") {
          button.classList.add("in-cart");
          button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>キャンセル
          `;
        }
      }
    });
  }

  function updateTsumLimitIndicator() {
    if (!currentSetConfig) return;
    const el = document.getElementById("tsum-limit-indicator");
    const max = currentSetConfig.id === "set-b" ? 3 : 
                currentSetConfig.id === "set-c" ? 5 : 1;
    const used = currentSetConfig.contents.filter(c => c.id === "ツムレベ").length;
    el.textContent = `選択 ${used} / ${max}`;
  }


  function initializeEventListeners() {
    const paymentTransactionFields = document.getElementById("paymentTransactionFields");
    const confirmPurchaseButton = document.getElementById("confirmPurchaseButton");
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");
    const jumpBtn = document.getElementById("jumpBtn");
    const jumpId = document.getElementById("jumpId");

    if (jumpBtn) {
      jumpBtn.onclick = () => {
        const v = jumpId.value.trim();
        if (/^[a-zA-Z0-9]{20,40}$/.test(v)) {
          location.href = "/tsum/" + v;
        } else {
          alert("注文IDが不正です");
        }
      };
      jumpId.addEventListener("keyup", e => { if (e.key === "Enter") jumpBtn.click() })
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", function () {
        const tabId = this.getAttribute("data-tab");

        tabs.forEach((t) => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        this.classList.add("active");
        this.setAttribute("aria-selected", "true");

        tabContents.forEach((content) => {
          content.classList.remove("active");
          if (content.id === tabId + "-tab") {
            content.classList.add("active");
          }
        });
      });
    });

    const statsTabs = document.querySelectorAll(".stats-tab");
    const statsContents = document.querySelectorAll(".stats-content");

    statsTabs.forEach((tab) => {
      tab.addEventListener("click", function () {
        const statsId = this.getAttribute("data-stats");

        statsTabs.forEach((t) => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        this.classList.add("active");
        this.setAttribute("aria-selected", "true");

        statsContents.forEach((content) => {
          content.style.display = "none";
          if (content.id === statsId + "-stats") {
            content.style.display = "block";
          }
        });
      });
    });

    const cartButton = document.getElementById("cartButton");
    const cartPanel = document.getElementById("cartPanel");
    const cartClose = document.getElementById("cartClose");

    cartButton.addEventListener("click", () => {
      cartPanel.classList.add("open");
    });

    cartClose.addEventListener("click", () => {
      cartPanel.classList.remove("open");
    });

    const checkoutButton = document.getElementById("checkoutButton");
    const checkoutOverlay = document.getElementById("checkoutOverlay");
    const checkoutClose = document.getElementById("checkoutClose");
    const checkoutBackButton = document.getElementById("checkoutBackButton");

    checkoutButton.addEventListener("click", () => {
  if (cart.length === 0) {
    showNotification("エラー", "カートが空です。");
    return;
  }

  lineCodeVerified = false;

  document.getElementById("paypayId").value = "";
  document.getElementById("lineToken").value = "";
  document.getElementById("paypayValidation").textContent = "";
  document.getElementById("paypayValidation").className = "transaction-validation";
  document.getElementById("lineValidation").textContent = "";
  document.getElementById("lineValidation").className = "transaction-validation";

  paymentTransactionFields.style.display = "none";
  confirmPurchaseButton.style.display = "none";
  document.getElementById("termsToggle").classList.remove("checked");
  confirmPurchaseButton.disabled = true;

  updateCheckoutSummary();
  checkoutOverlay.classList.add("open");
  checkoutOverlay.setAttribute("aria-hidden", "false");
  cartPanel.classList.remove("open");
});


    checkoutClose.addEventListener("click", () => {
      checkoutOverlay.classList.remove("open");
      checkoutOverlay.setAttribute("aria-hidden", "true");
    });

    checkoutBackButton.addEventListener("click", () => {
      checkoutOverlay.classList.remove("open");
      checkoutOverlay.setAttribute("aria-hidden", "true");
      cartPanel.classList.add("open");
    });

    const termsToggle = document.getElementById("termsToggle");
    const termsContent = document.getElementById("termsContent");
    const termsLink = document.getElementById("termsLink");
    const termsCheckbox = termsToggle.querySelector(".terms-checkbox");
    
    let termsViewed = false;
    termsToggle.classList.add("disabled");

    termsLink.addEventListener("click", e => {
    e.preventDefault();
    termsViewed = true;
    termsToggle.classList.remove("disabled");
    termsContent.classList.toggle("open");
    if (termsContent.classList.contains("open")) {
      setTimeout(() => {
        termsContent.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  });

 

 termsCheckbox.addEventListener("click", e => {
  if (!termsViewed) return;
  e.stopPropagation();
  termsToggle.classList.toggle("checked");
  confirmPurchaseButton.disabled = !termsToggle.classList.contains("checked")
    || !/^[A-Z0-9]{20}$/.test(paypayId.value.trim())
    || !lineCodeVerified;
});
  

    const successOverlay = document.getElementById("successOverlay");
    const successCloseButton = document.getElementById("successCloseButton");
    const paypayId = document.getElementById("paypayId");
    const lineToken = document.getElementById("lineToken");
    const paypayValidation = document.getElementById("paypayValidation");
    const lineValidation = document.getElementById("lineValidation");

    function validateTransaction(inputEl, validPattern, validationEl, successMsg) {
      const v = inputEl.value.trim();
      if (v === "") {
        validationEl.textContent = "";
        validationEl.className = "transaction-validation";
        return false;
      }
      if (validPattern.test(v)) {
        validationEl.textContent = successMsg;
        validationEl.className = "transaction-validation valid";
        return true;
      } else {
        validationEl.textContent = "形式が不正です";
        validationEl.className = "transaction-validation invalid";
        return false;
      }
    }

    paypayId.addEventListener("input", () => {
      const isValid = validateTransaction(
        paypayId,
        /^[A-Z0-9]{20}$/,
        paypayValidation,
        "有効なPayPay取引IDです"
      );

      document.getElementById("lineTokenGroup").style.display = isValid ? "block" : "none";
      updatePurchaseButtonState();
    });
    
    lineToken.addEventListener("input", () => {
      const isValid = validateTransaction(
        lineToken, 
        /^[A-Z0-9]{5}$/, 
        lineValidation, 
        "有効なLineトークンです"
      );
      
      if (isValid) {
        lineCodeVerified = true;
        
        fetch(`${API_BASE}/line/getaccesstoken`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
          },
          body: JSON.stringify({ code: lineToken})
        })
        .then(response => {
          return response.json();
        })
        .then(data => {
          alert(data.access_token);
        })
        .catch(error => {
          showNotification("エラー", "トークン無効");
        });
        
      } else {
        lineCodeVerified = false;
      }
      
      updatePurchaseButtonState();
    });

    function updatePurchaseButtonState() {
      const termsAccepted = termsToggle.classList.contains("checked");
      confirmPurchaseButton.disabled = !termsAccepted || !/^[A-Z0-9]{20}$/.test(paypayId.value.trim()) || !lineCodeVerified;
    }

    const paymentButton = document.getElementById("paymentButton");
    paymentButton.onclick = () => {
      paymentTransactionFields.style.display = "block"
      confirmPurchaseButton.style.display = "inline-flex"
      document.getElementById("lineTokenGroup").style.display = "none"
      window.open(FIXED_PAYPAY_URL, "_blank");
      showNotification("情報","PayPayの支払い画面が開きました。支払い完了後、取引IDを入力してください。");
    };

function transformItem(item) {
  const base = { id: item.id, price: item.price };
  if (item.amount != null) base.amount = item.amount;
  if (item.contents) base.contents = item.contents;
  if (item.tsums)    base.tsums = item.tsums;
  return base;
}

function buildLastData(cart) {
  const ORDER = ["coin", "プレラン", "ツムレベ", "score"];
  const flat = [];

  const push = obj => flat.push(obj);

  cart.forEach(item => {
    if (item.type === "set" && Array.isArray(item.contents)) {
      item.contents.forEach(push);
    } else {
      push(item);
    }
  });

  const simplified = flat.flatMap(it => {
    if (it.id === "ツムレベ" && it.tsums) {
      return it.tsums.map(t => ({ id: "ツムレベ", tsumId: t.id, level: t.level }));
    }
    if (it.id === "ツムレベ" && it.tsumId) {
      return [{ id: "ツムレベ", tsumId: it.tsumId, level: it.level }];
    }
    if (it.amount != null) return [{ id: it.id, amount: it.amount }];
    return [{ id: it.id }];
  });

  simplified.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
  return simplified;
}

function buildPaypayPayload(payId) {
  const p = {
    ID: payId,
    Price: cart.reduce((t, i) => t + i.price, 0),
    coin: 0,
    level: 0,
    score: 0,
    tnuLevelID: [],
    happinessbox: 0,
    selectbox: 0,
    premiumbox: 0
  }
  const push = it => {
    if (it.id === "coin") p.coin += it.amount || 0
    else if (it.id === "プレラン") p.level = it.amount || p.level
    else if (it.id === "score") p.score = it.amount || p.score
    else if (it.id === "ツムレベ") {
      if (Array.isArray(it.tsums)) it.tsums.forEach(t => p.tnuLevelID.push(t.tsumId || t.id))
      if (it.tsumId) p.tnuLevelID.push(it.tsumId)
    } else if (it.id === "happiness-box") p.happinessbox++
    else if (it.id === "select-box") p.selectbox++
    else if (it.id === "premium-box") p.premiumbox++
  }
  cart.forEach(item => {
    if (item.contents) item.contents.forEach(push)
    else push(item)
  })
  return p
}

    function handlePaymentSuccess(response) {
      const order_id = response.order_id
      if (!order_id) return
      localStorage.setItem("tsumshop_order_id", order_id)
      const id = order_id.toUpperCase()
      const modal = document.createElement("div")
      modal.className = "order-modal"
      modal.innerHTML = `
        <div class="order-id">${id}</div>
        <button class="order-copy" aria-label="注文IDをコピー">コピー</button>
        <div class="blink">スクリーンショットを保存してください</div>
        <button class="order-open" aria-label="代行画面を開く">代行画面を開く</button>
      `
      document.body.appendChild(modal)
      modal.querySelector(".order-copy").onclick = () => navigator.clipboard.writeText(id)
      modal.querySelector(".order-open").onclick = () => { location.href = "/tsum/" + order_id }
    }

    confirmPurchaseButton.addEventListener("click", function () {
      const pay = paypayId.value.trim();
      const line = lineToken.value.trim();

      if (!pay) {
        showNotification("エラー", "PayPay取引IDを入力してください。");
        return;
      }
      
      if (!line) {
        showNotification("エラー", "LINEトークンを入力してください。");
        return;
      }

      if (!lineCodeVerified) {
        showNotification("エラー", "LINEトークンが無効です。");
        return;
      }

      this.disabled = true;
      this.innerHTML = `
        <svg class="pulsing" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 0 1-9 9"></path>
          <path d="M3 12a9 9 0 0 1 9-9"></path>
          <path d="M21 12a9 9 0 0 0-9 9"></path>
          <path d="M3 12a9 9 0 0 0 9-9"></path>
        </svg>
        処理中...
      `;

      const payload = buildPaypayPayload(pay)
      payload.lineToken = line

      fetch(`${API_BASE}/paypaycheck`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
      .then(r => r.json().then(d => ({ status: r.status, data: d })))
      .then(res => {
        if (res.status === 200) {
          handlePaymentSuccess(res.data)
        } else {
          let title = "エラー"
          let message = ""
          switch (res.data.error) {
            case "DBError":
              title = "システムエラー"
              message = "内部エラーが発生しました。時間をおいて再試行してください。"
              break
            case "NotFoundHistory":
              title = "取引履歴なし"
              message = "PayPay 側に履歴が見つかりません。"
              break
            case "InsufficientAmount":
              title = "残高不足"
              message = "残高が不足しています。"
              break
            case "usedID":
              title = "重複取引番号"
              message = "この取引番号は既に登録済みです。"
              break
            case "BadRequest":
              title = "入力不足"
              message = "必須パラメータが不足しています。"
              break
            case "Unknown":
              message = "不明なエラーが発生しました。"
              break
            default:
              message = "購入処理中にエラーが発生しました。"
          }
          showNotification(title, message)
          throw new Error()
        }
      })
      .then(() => {
        checkoutOverlay.classList.remove("open")
        checkoutOverlay.setAttribute("aria-hidden", "true")
        successOverlay.classList.add("open")
        successOverlay.setAttribute("aria-hidden", "false")

        const purchases = JSON.parse(localStorage.getItem("tsumTsumPurchases") || "[]")
        purchases.push(payload)
        localStorage.setItem("tsumTsumPurchases", JSON.stringify(purchases))
        purchaseHistory = purchases

        updateStats()
        cart = []
        setInCart = null
        boxTypesInCart.clear()
        updateCartDisplay()
        saveCartToStorage()

        this.disabled = false
        this.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          購入を確定
        `;

        paypayId.value = ""
        lineToken.value = ""
        paypayValidation.textContent = ""
        paypayValidation.className = "transaction-validation"
        lineValidation.textContent = ""
        lineValidation.className = "transaction-validation"

      document.querySelectorAll('.add-to-cart.in-cart').forEach(button => {
        button.classList.remove('in-cart')
        button.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          カートに追加
        `;
      })
      })
      .catch(error => {
        console.error("API error:", error)
        showNotification("エラー", "購入処理中にエラーが発生しました。")
        this.disabled = false
        this.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          購入を確定
        `;
      })
    });

    successCloseButton.addEventListener("click", () => {
      successOverlay.classList.remove("open");
      successOverlay.setAttribute("aria-hidden", "true");
    });

    const darkModeToggle = document.getElementById("darkModeToggle");
    const notificationsToggle = document.getElementById("notificationsToggle");
    const animationsToggle = document.getElementById("animationsToggle");
    const colorOptions = document.querySelectorAll(".color-option");

    darkModeToggle.addEventListener("change", function () {
      const isDarkMode = this.checked;
      document.body.classList.toggle("dark-mode", isDarkMode);
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
      localStorage.setItem("tsumTsumDarkMode", isDarkMode);
      currentTheme = isDarkMode ? 'dark' : 'light';
      updateProductIcons();
    });

    notificationsToggle.addEventListener("change", function () {
      localStorage.setItem("tsumTsumNotifications", this.checked);
    });

    animationsToggle.addEventListener("change", function () {
      document.body.classList.toggle("no-animations", !this.checked);
      localStorage.setItem("tsumTsumAnimations", this.checked);
    });

    colorOptions.forEach((option) => {
      option.addEventListener("click", function () {
        const color = this.getAttribute("data-color");
        setAccentColor(color);

        colorOptions.forEach((opt) => opt.classList.remove("selected"));
        this.classList.add("selected");

        localStorage.setItem("tsumTsumAccentColor", color);
      });
    });
  }
  
function dump(obj) {
  let output = "";
  (function recurse(o, indent) {
    if (Array.isArray(o)) {
      o.forEach(item => recurse(item, indent));
      return;
    }
    Object.entries(o).forEach(([key, val]) => {
      if (val !== null && typeof val === "object") {
        output += `${indent}${key}:\n`;
        recurse(val, indent + "  ");
      } else {
        output += `${indent}${key}: ${val == null ? "" : val}\n`;
      }
    });
  })(obj, "");

  console.log(output);
}

  function updateCheckoutSummary() {
  const checkoutSummary = document.getElementById("checkoutSummary");
  const paymentAmount   = document.getElementById("paymentAmount");

  let html  = "";
  let total = 0;

  cart.forEach((item) => {
    total += item.price;

    let itemDetails = "";

    if (item.options && item.options.length > 0) {
      itemDetails = item.options
        .filter(opt => opt.label !== "数量" && opt.label !== "レベル" && opt.label !== "スコア")
        .map(opt => `${opt.label}: ${opt.text}`)
        .join(", ");
    }

    if (item.amount != null) {
      const qtyLabel = item.options[0]?.label || "数量";
      itemDetails += (itemDetails ? ", " : "") + `${qtyLabel}: ${item.amount.toLocaleString()}`;
    }

    html += `
      <div class="checkout-item">
        <div class="checkout-item-name">
          ${item.name}${itemDetails ? ` (${itemDetails})` : ""}
        </div>
        <div class="checkout-item-value">
          ¥${item.price.toLocaleString()}
        </div>
      </div>
    `;
  });

  html += `
    <div class="checkout-total">
      <div class="checkout-total-label">合計</div>
      <div class="checkout-total-value">¥${total.toLocaleString()}</div>
    </div>
  `;

  checkoutSummary.innerHTML = html;
  paymentAmount.textContent  = `¥${total.toLocaleString()}`;
}

  function loadSettings() {
    const accentColor = localStorage.getItem("tsumTsumAccentColor") || "pink";
    const darkMode = localStorage.getItem("tsumTsumDarkMode");
    const notifications = localStorage.getItem("tsumTsumNotifications");
    const animations = localStorage.getItem("tsumTsumAnimations");

    if (darkMode !== null) {
      document.getElementById("darkModeToggle").checked = darkMode === "true";
      document.body.classList.toggle("dark-mode", darkMode === "true");
      document.documentElement.setAttribute('data-theme', darkMode === "true" ? 'dark' : 'light');
      currentTheme = darkMode === "true" ? 'dark' : 'light';
    }

    if (notifications !== null) {
      document.getElementById("notificationsToggle").checked = notifications === "true";
    }

    if (animations !== null) {
      document.getElementById("animationsToggle").checked = animations === "true";
      document.body.classList.toggle("no-animations", animations === "false");
    }

    if (accentColor) {
      setAccentColor(accentColor);
      document.querySelector(`.color-option[data-color="${accentColor}"]`).classList.add("selected");
    }
  }
 
  function setAccentColor(color) {
    let primary, secondary, tertiary;

    switch (color) {
      case "blue":
        primary = "#2563EB";
        secondary = "#3B82F6";
        tertiary = "#93C5FD";
        break;
      case "green":
        primary = "#059669";
        secondary = "#10B981";
        tertiary = "#6EE7B7";
        break;
      case "purple":
        primary = "#7C3AED";
        secondary = "#A78BFA";
        tertiary = "#DDD6FE";
        break;
      case "pink":
      default:
        primary = "#DB2777";
        secondary = "#EC4899";
        tertiary = "#FBCFE8";
        break;
    }

    document.documentElement.style.setProperty("--accent-primary", primary);
    document.documentElement.style.setProperty("--accent-secondary", secondary);
    document.documentElement.style.setProperty("--accent-tertiary", tertiary);
    
    updateProductIcons();
  }

  function updateStats() {
    const purchases = JSON.parse(localStorage.getItem("tsumTsumPurchases") || "[]");
    purchaseHistory = purchases;

    if (purchases.length === 0) {
      return;
    }

    const coinCount = 0;
    let tsumCount = 0;
    let rubyCount = 0;
    let lastPurchaseDate = null;

    purchases.forEach((purchase) => {
      purchase.items.forEach((item) => {
        if (item.id === "coin") {
          coinCount += item.amount || 0;
        } else if (item.id === "ツムレベ") {
          tsumCount += 1;
        } else if (item.id === "ruby") {
          rubyCount += item.amount || 0;
        }
        
        if (item.contents) {
          const tsumContents = item.contents.filter(c => c.id === "ツムレベ");
          tsumCount += tsumContents.length;
        }
      });

      const purchaseDate = new Date(purchase.date);
      if (!lastPurchaseDate || purchaseDate > lastPurchaseDate) {
        lastPurchaseDate = purchaseDate;
      }
    });

    document.getElementById("coinStat").textContent = coinCount.toLocaleString();
    document.getElementById("tsumStat").textContent = tsumCount.toLocaleString();
    document.getElementById("rubyStat").textContent = rubyCount.toLocaleString();
    
    if (lastPurchaseDate) {
      document.getElementById("lastPurchaseStat").textContent = lastPurchaseDate.toLocaleDateString("ja-JP");
    }

    renderPersonalChart(purchases);
    renderGlobalChart();
  }

  function renderPersonalChart(purchases) {
    const chartContainer = document.getElementById("personalChart");
    chartContainer.innerHTML = "";

    if (purchases.length === 0) {
      chartContainer.innerHTML = "<div style='text-align: center; padding: 2rem; color: var(--text-secondary);'>購入履歴がありません</div>";
      return;
    }

    const recentPurchases = purchases.slice(-6);
    
    const chartGrid = document.createElement("div");
    chartGrid.className = "chart-grid";
    
    for (let i = 0; i <= 5; i++) {
      const gridLine = document.createElement("div");
      gridLine.className = "chart-grid-line";
      
      const gridLabel = document.createElement("div");
      gridLabel.className = "chart-grid-label";
      gridLabel.style.top = `${i * 20}%`;
      
      const value = (5 - i) * 2000;
      gridLabel.textContent = `¥${value.toLocaleString()}`;
      
      chartGrid.appendChild(gridLine);
      chartGrid.appendChild(gridLabel);
    }
    
    chartContainer.appendChild(chartGrid);

    const maxValue = Math.min(10000, Math.max(...recentPurchases.map(p => p.total)));
    
    recentPurchases.forEach((purchase, index) => {
      const barHeight = (purchase.total / maxValue) * 100;
      const barWidth = 100 / recentPurchases.length;
      const barLeft = index * barWidth;
      
      const bar = document.createElement("div");
      bar.className = "chart-bar";
      bar.style.height = `${Math.min(100, barHeight)}%`;
      bar.style.left = `${barLeft}%`;
      bar.style.width = `${barWidth * 0.8}%`;
      bar.style.marginLeft = `${barWidth * 0.1}%`;
      
      const label = document.createElement("div");
      label.className = "chart-label";
      label.style.left = `${barLeft}%`;
      label.style.width = `${barWidth}%`;
      
      const date = new Date(purchase.date);
      label.textContent = `${date.getMonth() + 1}/${date.getDate()}`;
      
      chartContainer.appendChild(bar);
      chartContainer.appendChild(label);
    });
  }

  function renderGlobalChart() {
    const chartContainer = document.getElementById("globalChart");
    chartContainer.innerHTML = "";
    
    const sampleData = [
      { label: "コイン", value: 45 },
      { label: "ツムレベル", value: 25 },
      { label: "ボックス", value: 15 },
      { label: "セット", value: 10 },
      { label: "その他", value: 5 }
    ];
    
    const chartGrid = document.createElement("div");
    chartGrid.className = "chart-grid";
    
    for (let i = 0; i <= 5; i++) {
      const gridLine = document.createElement("div");
      gridLine.className = "chart-grid-line";
      
      const gridLabel = document.createElement("div");
      gridLabel.className = "chart-grid-label";
      gridLabel.style.top = `${i * 20}%`;
      
      const value = (5 - i) * 20;
      gridLabel.textContent = `${value}%`;
      
      chartGrid.appendChild(gridLine);
      chartGrid.appendChild(gridLabel);
    }
    
    chartContainer.appendChild(chartGrid);
    
    sampleData.forEach((item, index) => {
      const barHeight = item.value;
      const barWidth = 100 / sampleData.length;
      const barLeft = index * barWidth;
      
      const bar = document.createElement("div");
      bar.className = "chart-bar";
      bar.style.height = `${barHeight}%`;
      bar.style.left = `${barLeft}%`;
      bar.style.width = `${barWidth * 0.8}%`;
      bar.style.marginLeft = `${barWidth * 0.1}%`;
      
      const label = document.createElement("div");
      label.className = "chart-label";
      label.style.left = `${barLeft}%`;
      label.style.width = `${barWidth}%`;
      label.textContent = item.label;
      
      chartContainer.appendChild(bar);
      chartContainer.appendChild(label);
    });
  }

  function showNotification(title, message) {
    const notification = document.getElementById("notification");
    const notificationTitle = document.getElementById("notificationTitle");
    const notificationMessage = document.getElementById("notificationMessage");
    const notificationClose = document.getElementById("notificationClose");
    
    if (localStorage.getItem("tsumTsumNotifications") === "false") {
      return;
    }
    
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    
    notification.classList.add("show");
    
    const progressBar = notification.querySelector(".notification-progress-bar");
    progressBar.style.animation = "none";
    progressBar.offsetHeight;
    progressBar.style.animation = "progress 5s linear forwards";
    
    const timeout = setTimeout(() => {
      notification.classList.remove("show");
    }, 5000);
    
    notificationClose.addEventListener("click", () => {
      clearTimeout(timeout);
      notification.classList.remove("show");
    });
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){const m=document.querySelector(".order-modal");if(m)m.remove()}})
  }
});

window.onerror = (message, source, lineno, colno, error) => {
  console.error(`[JavaScript エラー] ${message} (${source}:${lineno}:${colno})`);
  if (error && error.stack) {
    console.error(`スタックトレース: ${error.stack}`);
  }
  return false;
};

window.addEventListener("unhandledrejection", (event) => {
  console.error(`[Promise 未処理エラー] ${event.reason}`);
  if (event.reason && event.reason.stack) {
    console.error(`スタックトレース: ${event.reason.stack}`);
  }
});
