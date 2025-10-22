class GameUI {
    constructor(ctx, windowName){
        this.ctx = ctx;
        this.windowName = windowName;
        this.held = false;
        this.lastParent = "Scene";
        this.user = SM.myName();
        this.container = null;
        this.contentArea = null;
        // this.PaneEntity = null;
        this.doc = null;
        this.flipLogArea = null;
        this.flipResultHandler = null;
        this.flipCount = 0;

        this.ctx.onStart = async ()=>{
            console.log("GameUI", "onLoaded")
            //this.PaneEntity = await AddEntity(this.ctx._entity.id, "UI")
            this.doc = await this.ctx._entity._bs.AddComponent(new BS.BanterUI(new BS.Vector2(680,512), false));
            window.gameUI = this.doc;
            this.generateUI();
            
            // Listen for flip result events
            this.flipResultHandler = (event) => {
                log("GameUI", "flipResultHandler", event.detail)
                this.handleFlipResult(event.detail);
            };
            window.addEventListener('coinFlipResult', this.flipResultHandler);
            this.flipController = SM.getScriptByName("FlipController");
            log(`${this.windowName} UI`, "onLoaded")
        }

        this.ctx.onDestroy = async()=>{
            log(`${this.windowName} UI`, "onDestroy")

            // Remove event listener
            if (this.flipResultHandler) {
                window.removeEventListener('coinFlipResult', this.flipResultHandler);
            }

            // if(this.PaneEntity){
            //     await RemoveEntity(this.PaneEntity.id)
            // }
            if(this.doc){
                this.doc.Destroy();
            }
            
        }
        
    }

    generateUI(){
        log(`${this.windowName} UI`, "generating UI")
        if(this.container){
            this.container.Destroy();
        }
        log(`${this.windowName} UI`, "generating UI")
        this.container = this.doc.CreateVisualElement();
        this.container.style.display = "flex";
        this.container.style.flexDirection = "column";
        this.container.style.height = "100%";
        this.container.style.width = "100%";

        // Create content area for undo/redo items
        this.contentArea = this.doc.CreateVisualElement();
        this.contentArea.style.overflowY = "auto";
        this.contentArea.style.margin = "4px";
        this.contentArea.style.height = "100%"
        this.container.AppendChild(this.contentArea);


      

        this.doublePaneContainer = this.doc.CreateVisualElement();
        this.doublePaneContainer.style.display = "flex";
        this.doublePaneContainer.style.flexDirection = "row";
        this.doublePaneContainer.style.height = "400px";
        this.doublePaneContainer.style.width = "680px";
        


        // Create flip log area
        this.flipAreaContainer = this.doc.CreateVisualElement();
        this.flipAreaContainer.style.height = "400px";
        this.flipAreaContainer.style.width = "50%";
        this.flipAreaContainer.style.overflowY = "auto";
        this.flipAreaContainer.style.flexDirection = "column-reverse";
        this.doublePaneContainer.AppendChild(this.flipAreaContainer);

        


        this.doublePaneContainer.AppendChild(this.renderUpgrades());


        this.contentArea.AppendChild(this.doublePaneContainer);

        // Initialize flip log with placeholder
        this.bankElement = this.doc.CreateLabel();
        this.bankElement.text = "CASH";
        this.bankElement.style.fontSize = "32px";
        this.bankElement.style.textAlign = "center";
        this.bankElement.style.fontWeight = "bold";
        this.bankElement.style.color = "#4ade80";
        this.bankElement.style.backgroundColor = "rgba(0, 0, 0, 0.95)";
        this.bankElement.style.padding = "8px 8px";
        this.bankElement.style.borderRadius = "4px";
        this.bankElement.style.marginBottom = "0px";
        this.contentArea.AppendChild(this.bankElement);
    }

    renderUpgrade(title, upgradeFunction, val){
        let upgradeContainer = this.doc.CreateVisualElement();
        upgradeContainer.style.display = "flex";
        upgradeContainer.style.flexDirection = "row";
        upgradeContainer.style.justifyContent = "flex-end";
        upgradeContainer.style.alignItems = "flex-end";
        upgradeContainer.style.gap = "10px";

        const CoinUpgrade = this.doc.CreateButton();
        CoinUpgrade.text = title;
        CoinUpgrade.style.textAlign = "left";
        CoinUpgrade.OnClick(upgradeFunction);

        let currentValue = this.doc.CreateLabel();
        currentValue.text = val;
        currentValue.style.width = "32px";
        currentValue.style.height = "32px";
        currentValue.style.fontSize = "12px";
        currentValue.style.color = "white";
        currentValue.style.fontWeight = "bold";
        currentValue.style.textAlign = "center";
        currentValue.style.justifyContent = "center";
        currentValue.style.alignItems = "center";

        upgradeContainer.AppendChild(CoinUpgrade);
        upgradeContainer.AppendChild(currentValue);
        return upgradeContainer;
    }


    renderUpgrades(){
        this.upgradeAreaContainer = this.doc.CreateVisualElement();
        this.upgradeAreaContainer.style.height = "400px";
        this.upgradeAreaContainer.style.width = "50%";
        this.upgradeAreaContainer.style.flexDirection = "column";
        this.upgradeAreaContainer.style.justifyContent = "flex-end";
        this.upgradeAreaContainer.style.alignItems = "flex-end";
        this.upgradeAreaContainer.style.gap = "10px";

        
        this.upgradeAreaContainer.AppendChild(
            this.renderUpgrade(
                "↑ Coin Value: $0.01", 
                () => {
                    log("GameUI", "Upgrade");
                }, "1¢"
            )
        );

        this.upgradeAreaContainer.AppendChild(
            this.renderUpgrade(
                "↓ Flip force by -.005: $0.01", 
                () => {
                    log("GameUI", "Upgrade");
                }, "1¢"
            )
        );

        this.upgradeAreaContainer.AppendChild(

            this.renderUpgrade(
                "Better Center of Mass: $0.01", 
                () => {
                    log("GameUI", "Upgrade");
                }, "1¢"
            )
        );
        
        this.upgradeAreaContainer.AppendChild(
            this.renderUpgrade(
                "↑ .5X Combo Multiplier: $0.01", 
                () => {
                    log("GameUI", "Upgrade");
                }, "1¢"
            )
        );  

        return this.upgradeAreaContainer;
    }

    addLog(text, color){
        const resultLabel = this.doc.CreateLabel();
        resultLabel.text = text;
        resultLabel.style.color = color;
        resultLabel.style.fontSize = "18px";
        if(this.flipAreaContainer.children.length > 11){
            this.flipAreaContainer.children[this.flipAreaContainer.children.length - 1].Destroy();
        }
        this.flipAreaContainer.InsertBefore(resultLabel, this.flipAreaContainer.children[0]);
    }

    handleFlipResult(detail) {
        if (!this.contentArea || !this.doc || !this.flipAreaContainer) return;
   
        if (detail.result === 'heads') {
            const exclamations = detail.streak > 1 ? '!'.repeat(detail.streak - 1) : '';
            this.addLog(`HEADS${exclamations}`, "#22c55e");
        } else {
            this.addLog("TAILS", "#888888");
        }

        this.bankElement.text = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(detail.bankroll);
        this.flipCount++;
        this.story();
    }

    story(){
        log("GameUI", "story", this.flipCount)
        if(this.flipCount === 3){
            this.addLog("A game inspired by Unfair Flips..", "#dec64a")
        }
        if(this.flipCount === 8){
            this.addLog("The rules are simple..", "#dec64a")
        }
        if(this.flipCount === 13){
            this.addLog("You flip a coin, earn money and buy upgrades..", "#dec64a")
        }
        if(this.flipCount === 30){
            this.addLog("The higher the streak, the more money you earn..", "#dec64a")
        }
        if(this.flipCount === 50){
            this.addLog("You win by flipping 10 heads in a row.", "#dec64a")
        }
        if(this.flipCount === 60){
            this.addLog("You could win immediately, or never.", "#dec64a")
        }
        if(this.flipCount === 70){
            this.addLog("Your odds get better over time..", "#dec64a")
        }
        if(this.flipCount === 80){
            this.addLog("but nothing is certain..", "#dec64a")
        }

        if(this.flipCount === 150){
            this.addLog("The original game did not the same upgrades..", "#dec64a")
        }
        if(this.flipCount === 160){
            this.addLog("Instead of flip force, it was spin time..", "#dec64a")
        }
        if(this.flipCount === 170){
            this.addLog("Instead of center of mass, it was probability..", "#dec64a")
        }

        if(this.flipCount === 180){
            this.addLog("This was because it didn't have physics..", "#dec64a")
        }

        if(this.flipCount === 190){
            this.addLog("Everything was hardcoded.", "#dec64a")
        }

        if(this.flipCount === 200){
            this.addLog("Explicitly outlined.", "#dec64a")
        }

        if(this.flipCount === 210){
            this.addLog("Here things are different..", "#dec64a")
        }
        if(this.flipCount === 220){
            this.addLog("I cannot know the probabilities perfectly..", "#dec64a")
        }
        if(this.flipCount === 220){
            this.addLog("All of the quirks of Unity make it impossible.", "#dec64a")
        }
        if(this.flipCount === 240){
            this.addLog("It is all uncertain.", "#dec64a")
        }

        if(this.flipCount === 500){
            this.addLog("This is your 500th flip..", "#dec64a")
        }

        if(this.flipCount === 510){
            this.addLog("I respect your enthusiasm..", "#dec64a")
        }
        
        if(this.flipCount === 1024){
            this.addLog("This is your 1024th flip..", "#dec64a")
        }

        if(this.flipCount === 1035){
            this.addLog("If this were a fair coin...", "#dec64a")
        }

        if(this.flipCount === 1040){
            this.addLog("You would expect to do ~2046 flips before winning.. ", "#dec64a")
        }

        if(this.flipCount === 1045){
            this.addLog("but this is not a fair coin.. ", "#dec64a")
        }

        if(this.flipCount === 1500){
            this.addLog("Wanna know a secret?", "#dec64a")
        }

        if(this.flipCount === 1510){
            this.addLog("The well in this world is a wishing well", "#dec64a")
        }

        if(this.flipCount === 1530){
            this.addLog("If you throw a coin into it, you can make a wish..", "#dec64a")
        }

        if(this.flipCount === 1550){
            this.addLog("It may or may not come true..", "#dec64a")
        }

        if(this.flipCount === 1570){
            this.addLog("It prefers more expensive coins", "#dec64a")
        }


    }

    async DestroySelf(){
        log(`${this.windowName} UI`, "Destroying Blank UI");
        await RemoveEntity(this.ctx._entity.id);
    }
}

this.UI = new GameUI(this, "Game");


