(function() {
  var db = window.localStorage;
  var dbKey = "wins";
  var winData = {};
  if (db) {
    winData = JSON.parse(db.getItem(dbKey)) || {};
  }
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  ctx.font = "30px Arial";
  var timeScale = 1.0;

  var width = parseInt(canvas.getAttribute("width"), 10);
  var height = parseInt(canvas.getAttribute("height"), 10);
  var objectSize = 20;
  var teamSize = 3;
  var lastTime = 0;
  var globalState = {
    winner: null,
    gameOverStart: null,
    statScreenStart: null
  };
  var getNewID = (function() {
    var id = 0;
    return function() {
      id++;
      return id;
    };
  })();

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function GameObject(team) {
    return {
      alive: true,
      color: team,
      direction: {
        x: randomInRange(0.1, 0.5),
        y: randomInRange(0.1, 0.5)
      },
      id: getNewID(),
      position: {
        x: randomInRange(objectSize, width - objectSize),
        y: randomInRange(objectSize, height - objectSize)
      },
      size: { width: objectSize, height: objectSize },
      team: team,
      hitPoints: 10,
      heals: 3,
      strength: Math.ceil(randomInRange(1, 3))
    };
  }

  function GameState() {
    var objects = [];
    for (var i = 0; i < teamSize; i++) {
      objects = objects.concat([
        GameObject("red"),
        GameObject("blue"),
        GameObject("green"),
        GameObject("yellow"),
        GameObject("orange"),
        GameObject("teal"),
        GameObject("brown")
      ]);
    }
    return {
      frame: {
        collisions: []
      },
      objects: objects,
      input: {}
    };
  }

  var state = GameState();

  function clear() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
  }

  function checkCollision(ob1, ob2) {
    return (
      ob1.position.x < ob2.position.x + ob2.size.width &&
      ob1.position.x + ob1.size.width > ob2.position.x &&
      ob1.position.y < ob2.position.y + ob2.size.height &&
      ob1.size.height + ob1.position.y > ob2.position.y
    );
  }

  function firstLoop(time) {
    clear();
    lastTime = time;
    document.onkeydown = function(key) {
      key.preventDefault();
      if (!state.input[key.code]) {
        state.input[key.code] = {
          key: key,
          pressed: Date.now()
        };
      }
    };

    document.onkeyup = function(key) {
      key.preventDefault();
      state.input[key.code] = null;
    };

    requestAnimationFrame(loop);
  }

  function statsScreen(time) {
    clear();

    ctx.font = "30px Arial";
    lastTime = time;
    if (winData && time - globalState.statScreenStart < 3000) {
      ctx.fillStyle = "white";
      var y = 50;
      ctx.fillText("Wins:", 10, y);
      for (var team in winData) {
        y += 30;
        ctx.fillStyle = team;
        ctx.fillText(team + " : " + winData[team], 10, y);
      }
      requestAnimationFrame(statsScreen);
    } else {
      requestAnimationFrame(restartGame);
    }
  }

  function restartGame(time) {
    clear();
    lastTime = time;
    state = new GameState();
    requestAnimationFrame(loop);
  }

  function takeDamage(ob, dmg) {
    ob.hitPoints -= dmg;
    if (ob.hitPoints <= 0) {
      ob.alive = false;
    }
  }

  function heal(ob, ob2) {
    if (ob.hitPoints < 10) {
      ob.hitPoints += ob2.heals;
      ob2.heals--;
      if (ob.hitPoints > 10) {
        ob.hitPoints = 10;
      }
      if (ob2.heals < 0) {
        ob2.heals = 0;
      }
    }
  }

  function updateObject(ob, dt) {
    if (ob.direction != null && ob.alive) {
      ob.position.x += dt * ob.direction.x;
      ob.position.y += dt * ob.direction.y;
      if (ob.position.x + ob.size.width > width || ob.position.x < 0) {
        ob.direction.x *= -1;
      }
      if (ob.position.y + ob.size.height > height || ob.position.y < 0) {
        ob.direction.y *= -1;
      }
      if (ob.position.y < 0) {
        ob.position.y = 0;
      }
      if (ob.position.y > height - ob.size.height) {
        ob.position.y = height - ob.size.height;
      }
      if (ob.position.x < 0) {
        ob.position.x = 0;
      }
      if (ob.position.x > width - ob.size.width) {
        ob.position.x = width - ob.size.width;
      }

      state.objects.forEach(function(ob2) {
        if (ob2.id === ob.id) {
          return;
        } else if (ob2.alive && checkCollision(ob, ob2)) {
          if (ob.team !== ob2.team) {
            if (Math.random() < 0.5) {
              takeDamage(ob, ob2.strength);
            } else {
              takeDamage(ob2, ob.strength);
            }
            ob.color = "white";
            ob2.color = "white";
            state.frame.collisions.push([ob, ob2]);
          } else {
            heal(ob, ob2);
            heal(ob2, ob);
          }
        } else {
          ob.color = ob.team;
          ob2.color = ob2.team;
        }
      });
    }
  }

  function updateState() {}

  function draw(ob) {
    if (ob.alive) {
      ctx.fillStyle = "white";
      ctx.font = "10px Arial";
      ctx.fillText(
        "" + ob.hitPoints + "/" + ob.strength,
        ob.position.x,
        ob.position.y - 10
      );
    }
    ctx.fillStyle = ob.color;
    ctx.fillRect(ob.position.x, ob.position.y, ob.size.width, ob.size.height);
  }

  function resetFrameState() {
    state.frame.collisions = [];
  }

  function teamsLeftInAction() {
    return state.objects
      .filter(function(ob) {
        return ob.alive;
      })
      .reduce(function(acc, cur) {
        if (acc.indexOf(cur.team) === -1) {
          acc.push(cur.team);
        }
        return acc;
      }, []);
  }

  function gameOverScreen(time) {
    clear();
    lastTime = time;
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Game Over, winner: " + globalState.winner, 10, 50);
    if (time - globalState.gameOverStart > 2000) {
      globalState.statScreenStart = time;
      requestAnimationFrame(statsScreen);
    } else {
      requestAnimationFrame(gameOverScreen);
    }
  }

  function saveWin(winner) {
    globalState.winner = winner;
    if (winData[globalState.winner]) {
      winData[globalState.winner]++;
    } else {
      winData[globalState.winner] = 1;
    }
    if (db) {
      db.setItem(dbKey, JSON.stringify(winData));
    }
  }

  function loop(time) {
    clear();
    resetFrameState();
    state.objects.forEach(function(ob) {
      draw(ob);
    });
    if (state.input["ArrowUp"]) {
      timeScale = 2;
    } else if (state.input["ArrowDown"]) {
      timeScale = 0.5;
    } else {
      timeScale = 1.0;
    }
    var dt = (time - lastTime) * timeScale;
    state.objects.forEach(function(ob) {
      updateObject(ob, dt);
    });
    updateState();
    lastTime = time;
    var teamsLeft = teamsLeftInAction();
    if (teamsLeft.length !== 1) {
      requestAnimationFrame(loop);
    } else {
      saveWin(teamsLeft[0]);
      globalState.gameOverStart = time;
      requestAnimationFrame(gameOverScreen);
    }
  }
  requestAnimationFrame(firstLoop);
})();
