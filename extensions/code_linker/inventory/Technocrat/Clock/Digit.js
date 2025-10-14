
let getChildEntity = (childName)=>{
    let rel_path = this._entity.id+"/"+childName
    return SM.getEntityById(rel_path)
}

// Track last displayed number to avoid unnecessary updates
this.lastNumber = -1

this.displayNumber = (number)=>{
    // Only update if the number has changed
    if (number === this.lastNumber) {
        return
    }
    this.lastNumber = number
    let A = getChildEntity("A")
    let B = getChildEntity("B")
    let C = getChildEntity("C")
    let D = getChildEntity("D")
    let E = getChildEntity("E")
    let F = getChildEntity("F")
    let G = getChildEntity("G")

    // Define which segments should be on/off for each digit 0-9
    const patterns = {
        0: { A: true,  B: true,  C: true,  D: true,  E: true,  F: true,  G: false },
        1: { A: false, B: true,  C: true,  D: false, E: false, F: false, G: false },
        2: { A: true,  B: true,  C: false, D: true,  E: true,  F: false, G: true  },
        3: { A: true,  B: true,  C: true,  D: true,  E: false, F: false, G: true  },
        4: { A: false, B: true,  C: true,  D: false, E: false, F: true,  G: true  },
        5: { A: true,  B: false, C: true,  D: true,  E: false, F: true,  G: true  },
        6: { A: true,  B: false, C: true,  D: true,  E: true,  F: true,  G: true  },
        7: { A: true,  B: true,  C: true,  D: false, E: false, F: false, G: false },
        8: { A: true,  B: true,  C: true,  D: true,  E: true,  F: true,  G: true  },
        9: { A: true,  B: true,  C: true,  D: true,  E: false, F: true,  G: true  }
    };

    // Apply the pattern for the given number
    if(number >= 0 && number <= 9) {
        const pattern = patterns[number];
        if(A) A.Set("active", pattern.A);
        if(B) B.Set("active", pattern.B);
        if(C) C.Set("active", pattern.C);
        if(D) D.Set("active", pattern.D);
        if(E) E.Set("active", pattern.E);
        if(F) F.Set("active", pattern.F);
        if(G) G.Set("active", pattern.G);
    }
}

this.onStart = ()=>{
    this._entity._digitScript = this;
}

this.onDestroy = ()=>{
    this._entity._digitScript = null;
}