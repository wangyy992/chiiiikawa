# 美术制作说明

使用内置 image_gen 生成角色、跳跃姿态、背景和物件图集。最终素材位于 assets/，共 13 张 PNG。生成图经色键清理和切片后接入游戏，没有以代码绘图替代美术。

裂谷段另生成一张低对比水彩峡谷背景。普通裂谷气流只改变移动状态，仍会受到怪物伤害；金色吉他应援飞行才提供全伤害免疫和撞碎障碍能力。

## 最终提示词集

### 角色
A production game character sprite sheet, landscape 1536x1024. Three full-body characters side by side, evenly spaced, no overlap. Left Chiikawa: round small white bear with tiny round ears and pink cheeks, shy sweet face. Center Hachiware: round white cat with blue ears and iconic blue split forehead cap, happy expression. Right Usagi: pale cream-yellow rabbit with long upright ears, cheeky open smile. All three facing slightly right, little arms out, one foot forward, full body visible, feet aligned near bottom 850px. Recognizable Chiikawa anime designs, premium delicate warm brown ink outlines, very subtle soft watercolor texture, softly shaded blush, clean polished cute Japanese illustrated game sprites, NOT 3D, NOT realistic fur. Exact uniform solid hot magenta #FF00FF background, no texture or shading on background, no checkerboard, no shadows, no labels, no props. Characters entirely inside their own thirds with big empty margins. Make characters delightful and meticulously finished.

### 跳跃姿态（以角色图为编辑目标）
Edit this game sprite sheet into the SECOND animation pose sheet. Keep same exact three characters and their colors/designs, same 1536x1024 layout, one in each third, same magenta background. Change only poses and facial expressions: all three joyfully JUMPING to the right, tiny arms raised, tiny feet apart and tucked, bodies slightly tilted forward. Chiikawa smiling with eyes squeezed happily, Hachiware delighted open smile, Usagi excited playful expression. Keep exact warm brown refined outlines and watercolor finish. No motion lines, no shadows, no other objects, absolutely flat uniform vivid #FF00FF background. Full characters entirely contained within their own column.

### 背景
Use case: illustration-story. Asset type: actual finished background painting for a premium cozy Chiikawa fan 2D side-scrolling game, NOT a UI mockup. Widescreen 1536x1024 illustration. A dreamy sunlit Chiikawa world with a tiny rounded cream house with blue roof far left, a small mushroom-shaped cottage far right, distant soft green hills, fluffy clouds in pale blue sky, meandering narrow stream, pastel flower meadow. Delicate watercolor/gouache on warm paper, polished Japanese picture-book art, subtle texture, refined charming details. Composition STRICT: the bottom 28 percent of the image is an EMPTY LOW-CONTRAST pale mint meadow with no objects, no flowers, no stones, no characters and no path edges; this is reserved as uncluttered space behind the gameplay lane. Buildings and trees must remain far in the background above 65 percent image height, small and misty. Center of image very open airy space. Soft desaturated background values, no black outlines, no foreground objects that could be confused for hazards. Full bleed no border no text no characters. Beautiful delicate ambient background with foreground gameplay added separately by game engine.

### 物件
Use case: stylized-concept. Production 2D game object sprite atlas, transparent alpha background, 1536x1024, EXACT 3 columns x 2 rows of equal 512x512 cells. Six completely separated objects, one centered per cell with 50px empty gutters, no text, no ground, no grid or checkerboard. Art style premium Chiikawa fan-game, warm dark brown clean anime outlines, soft gouache texture, pastel colors with stronger saturation than a watercolor background, finely finished cute illustration. Top left cell: pink Chiikawa chimera monster, fluffy pink lion mane, cream face, small curled yellow horns, mischievous fang mouth, four paws, facing RIGHT in running pose. Top middle cell: dangerous oversized scarlet red spotted mushroom creature, small pale stem, expressive grumpy eyes, recognizable strong silhouette. Top right cell: dense dark teal thorny weed tuft with a few purple burrs, clear pointy hazardous silhouette. Bottom left cell: golden coin with embossed five-point star, shiny hand-painted highlights, isolated single coin. Bottom middle cell: little orange acoustic guitar with tiny mint ribbon, isolated instrument. Bottom right cell: rectangular platform block of short emerald turf on top of tan layered earth, front orthographic side view, flat horizontal top, approximately 400 wide and 170 tall within its cell, no surrounding scenery. Consistent illumination, actual transparent background, all objects wholly within cells.

### 物件背景编辑
Edit target: attached six-object game atlas. Preserve ALL six objects exactly, positions and proportions and image dimensions unchanged. Replace every checkerboard background pixel with a perfectly uniform solid vivid magenta #FF00FF background, including all gaps and outside edges. No checkerboard anywhere. Do not paint magenta inside the actual objects. This is a production chroma-key sprite atlas. Flat exact magenta #FF00FF is essential. Keep the beautiful objects unchanged.

## 游戏中的区分规则

- 背景低对比，不参与碰撞。
- 绿色顶面可站立，主地面连续铺设。
- 危险物高对比，带独立红色 !。
- 金币与吉他可收集。
- 角色碰撞盒略小于外观，不让耳朵产生不公平碰撞。
