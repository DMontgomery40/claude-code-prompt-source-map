# ChatGPT learning blocks

Learning blocks are the interactive math, physics, chemistry, biology and data visualizations ChatGPT shows next to an answer: a graph, a 3D scene or an animation, often with sliders and switches the user can change. This build ships **1621 block types**, 1592 with a view registered: 22 three.js 3D scenes, 761 Lottie animations and 809 other views (neither three.js nor Lottie). 784 have an animated Lottie thumbnail, 160 stand for a named formula, and 451 take parameters the server can set.

Source: ChatGPT desktop 26.928.21956 (build 12404), `app.asar` → `webview/assets/`: the block registry `analytics-d7f135dc6152.js` (1665 registered views), 1006 manifest modules (`type-*.js`) and the type enum `chatgpt_math_blocks-1c0e05f75070.js`.

## How a block reaches the conversation

- A block arrives as a **content reference** on an assistant message, category `learning_block`. Its data names the block (`matched_type`), the widget (`widget_type`), the server's block version (`server_learning_block_version`) and the starting parameter values (`encoded_initial_values`). The model's answer text is not changed; the app renders the matched block beside it, inline or as a card (`display_mode`).
- The render source the app reports for these blocks is `CHATGPT_MATH_BLOCK_RENDER_SOURCE_GENUI_LEARNING_BLOCK`: the server's generative-UI layer matched the answer to a block type. The app does not choose blocks itself.
- Formula blocks carry a `canonicalFormula` (and some `canonicalFormulaAliases`) in their manifest. The app uses the formula only as display text: it shows it when the reference's `content_type` is `canonical_formula` or `placeholder`, and otherwise shows the content the server sent. No app code reads the aliases, so no matching of the model's equations happens in the app.
- Feedback on a block is posted to `POST /conversation/message/learning-blocks/feedback` with the matched type, the rendered and server block versions, the initial values, whether the user edited the block, and the chosen reasons.
- A block can offer follow-up questions. Choosing one sends a new user message whose metadata marks it `followups_v2_followup_source: "learning_block_suggested_followup"`, so the request records that the question came from a block.
- Generative-UI widgets on a message that are still being completed are polled through `POST /conversation/{conversation_id}/message/{message_id}/genui/refresh_widget` (message metadata `genui_refresh`).
- Analytics actions: `CODEX_LEARNING_BLOCK_ACTION_IMPRESSION`, `_FALLBACK`, `_FOLLOW_UP_SHOWN`, `_FOLLOW_UP_SELECTED`, `_FEEDBACK_OPENED`, `_FEEDBACK_SUBMITTED` and `_FEEDBACK_FAILED`.

Counting: a block type is one manifest `type` (or, for a view whose manifest is inline in the registry, its analytics type); where a type ships more than one view or manifest version, the highest version is listed. The type enum (`CHATGPT_MATH_BLOCK_TYPE_*`) has 962 values; 126 of them have no registered view or manifest in this build (`ABSOLUTE_VALUE_DISTANCE`, `ADULT_CPR_AED_SEQUENCE`, `ALCOHOL_OXIDATION`, `APPLYING_A_SCREEN_PROTECTOR`, `APPLYING_CAULK`, `APPLYING_SUNSCREEN`, `ASTHMA_AIRWAY_FLOW`, `BACTERIAL_GROWTH_CURVE`, `BASKETBALL_LAYUP`, `BOHR_MODEL`, `BOND_ENTHALPY`, `BOWLINE_KNOT`, …; all are in the JSON). Blocks registered without an analytics type (`UNSPECIFIED`) are identified by their manifest. 384 blocks have no separate manifest module (378 of them are defined inside the registry chunk); their parameters are not listed here. 1 manifest modules could not be evaluated and are listed from their literals only. A title is the block's thumbnail animation name where it has one, otherwise its type name in words; the sentence under it is the view's own accessibility label.

## Blocks

### three.js 3D scenes (22)

#### Column space: `A\mathbf{x}\in\operatorname{span}(A)`

Type `COLUMN_SPACE` · manifest v1 · formula `A\mathbf{x}\in\operatorname{span}(A)`, also `\operatorname{Col}(A)=\operatorname{span}\{\mathbf{a}_1,\mathbf{a}_2,\mathbf{a}_3\}`.

Parameters: `rank` (integer, default `1`, range 1 to 3); `inputX` (number, default `1`, range -1.5 to 1.5); `inputY` (number, default `0`, range -1.5 to 1.5); `inputZ` (number, default `0`, range -1.5 to 1.5).

Source: manifest `model-44d6ee3a3108.js`; view `visualization-418c928bbaa4.js` → `ColumnSpaceVisualization`.

#### Cylindrical coordinates: `\int_{a_z}^{b_z}\int_{a_{\theta}}^{b_{\theta}}\int_{a_r}^{b_r}r\,dr\,d\theta\,dz`

Type `CYLINDRICAL_COORDINATES` · manifest v1 · formula `\int_{a_z}^{b_z}\int_{a_{\theta}}^{b_{\theta}}\int_{a_r}^{b_r}r\,dr\,d\theta\,dz`.

Parameters: `rStart` (number, default `0`, range 0 to 5); `r` (number, default `3`, range 0 to 5); `thetaStart` (number, default `0`, range 0 to 6.283185307179586); `theta` (number, default `6.283185307179586`, range 0 to 6.283185307179586); `zStart` (number, default `0`, range 0 to 5); `z` (number, default `3`, range 0 to 5); `shape` (enum, default `cylinder`, one of `cylinder`, `sector`, `cylindrical-shell`).

Source: manifest `content-c9925bc5b917.js`; view `visualization-b186b208958e.js` → `CylindricalCoordinatesVisualization`.

#### Divergence theorem flux: `\iint_{\partial V}\mathbf F\cdot\mathbf n\,dS=\iiint_V\nabla\cdot\mathbf F\,dV`

Type `DIVERGENCE_THEOREM_FLUX` · manifest v1 · formula `\iint_{\partial V}\mathbf F\cdot\mathbf n\,dS=\iiint_V\nabla\cdot\mathbf F\,dV`.

Parameters: `radius` (number, default `1.35`, range 0.8 to 1.9); `strength` (number, default `0.75`, range -1.2 to 1.2).

Source: manifest `type-a59f58f3e3e0.js`; view `visualization-2e9e5c4e19ff.js` → `DivergenceTheoremFluxVisualization`.

#### Double integral cartesian

Type `DOUBLE_INTEGRAL_CARTESIAN`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-21615b2cefb8.js` → `CartesianDoubleIntegralVisualization`.

#### Gradient directional derivative: `D_{\mathbf u}f=\nabla f\cdot\mathbf u`

Type `GRADIENT_DIRECTIONAL_DERIVATIVE` · manifest v1 · formula `D_{\mathbf u}f=\nabla f\cdot\mathbf u`.

Parameters: `angle` (number, default `35`, range 0 to 360); `pointX` (number, default `1`, range -2.2 to 2.2); `pointY` (number, default `0.65`, range -1.6 to 1.6).

Source: manifest `type-977bdfa6cb63.js`; view `visualization-d03d61a3b372.js` → `GradientDirectionalDerivativeVisualization`.

#### Jacobian grid transformation: `dA=\left|\det J\right|\,du\,dv`

Type `JACOBIAN_GRID_TRANSFORMATION` · manifest v1 · formula `dA=\left|\det J\right|\,du\,dv`.

Parameters: `scale` (number, default `1.4`, range 0.7 to 2); `shear` (number, default `0.6`, range -0.95 to 0.95).

Source: manifest `type-f72a37ec91c5.js`; view `visualization-50c38c66caa4.js` → `JacobianGridTransformationVisualization`.

#### Lagrange gradient parallelism: `\nabla f=\lambda\nabla g`

Type `LAGRANGE_GRADIENT_PARALLELISM` · manifest v1 · formula `\nabla f=\lambda\nabla g`.

Parameters: `example` (enum, default `linear`, one of `linear`, `product`, `ellipse`); `angleDegrees` (number, default `30`, range 0 to 360).

Source: manifest `model-b583204f43e9.js`; view `visualization-1aa35c8d408c.js` → `LagrangeGradientParallelismVisualization`.

#### Line integral work

Type `LINE_INTEGRAL_WORK`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-10e6dfc9597c.js` → `LineIntegralWorkVisualization`.

#### Multivariable limit paths: `f(x,y)=\frac{x^2-y^2}{x^2+y^2}`

Type `MULTIVARIABLE_LIMIT_PATHS` · manifest v1 · formula `f(x,y)=\frac{x^2-y^2}{x^2+y^2}`.

Parameters: `mode` (enum, default `dne`, one of `dne`, `exists`); `path` (enum, default `y-zero`, one of `y-zero`, `x-zero`); `distance` (number, default `0.75`, range 0 to 1.2).

Source: manifest `model-2e64cf87fd64.js`; view `visualization-20734f10a402.js` → `MultivariableLimitPathsVisualization`.

#### Null space: `A\mathbf{x}=\mathbf{0}`

Type `NULL_SPACE` · manifest v1 · formula `A\mathbf{x}=\mathbf{0}`, also `\operatorname{Null}(A)=\ker(A)`.

Parameters: `rank` (integer, default `1`, range 1 to 3).

Source: manifest `model-b86e7b9561e2.js`; view `visualization-a00c704dde7c.js` → `NullSpaceVisualization`.

#### Parametrized line 2d

Line-integral parameter {parameter}

Type `PARAMETRIZED_LINE_2D` · manifest v1 (also v1).

Parameters: `t` (number, default `0`, range -12.566370614359172 to 12.566370614359172).

Source: manifest `model-e5ade770ac2f.js`; view `visualization-bd7a59e1e9d2.js` → `LineIntegralVisualization`.

#### Parametrized line 3d

Curve parameter {parameter}

Type `PARAMETRIZED_LINE_3D` · manifest v1.

Parameters: `t` (number, default `0`, range -12.566370614359172 to 12.566370614359172).

Source: manifest `model-2139461cc43f.js`; view `visualization-99beef34fcdc.js` → `ParametrizedLine3DVisualization`.

#### Parametrized surfaces

Type `PARAMETRIZED_SURFACES` · manifest v1.

Parameters: `t` (number, default `1`, range -2 to 2); `s` (number, default `1.5707963267948966`, range -6.283185307179586 to 6.283185307179586).

Source: manifest `model-a4f0614d0c79.js`; view `visualization-bf68daf45e5d.js` → `ParametrizedSurfacesVisualization`.

#### Power iteration

Type `POWER_ITERATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-1de149ef4245.js` → `PowerIterationVisualization`.

#### Shifted inverse iteration: `\mathbf{x}_{k+1}=\frac{B\mathbf{x}_k}{\lVert B\mathbf{x}_k\rVert}`

Type `SHIFTED_INVERSE_ITERATION` · manifest v1 · formula `\mathbf{x}_{k+1}=\frac{B\mathbf{x}_k}{\lVert B\mathbf{x}_k\rVert}`.

Parameters: `mode` (enum, default `shifted`, one of `shifted`, `inverse`, `shifted_inverse`).

Source: manifest `model-7393bb1ed478.js`; view `visualization-b362e1437a9e.js` → `ShiftedInverseIterationVisualization`.

#### Solar system

Type `SOLAR_SYSTEM`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-31945c883e75.js` → `SolarSystemVisualization`.

#### Spherical coordinates: `\int_{a_p}^{b_p}\int_{a_{\phi}}^{b_{\phi}}\int_{a_{\theta}}^{b_{\theta}}p^2\sin\phi\,d\theta\,d\phi\,dp`

Type `SPHERICAL_COORDINATES` · manifest v1 · formula `\int_{a_p}^{b_p}\int_{a_{\phi}}^{b_{\phi}}\int_{a_{\theta}}^{b_{\theta}}p^2\sin\phi\,d\theta\,d\phi\,dp`.

Parameters: `p` (number, default `3`, range 0 to 5); `phi` (number, default `3.141592653589793`, range 0 to 3.141592653589793); `theta` (number, default `6.283185307179586`, range 0 to 6.283185307179586); `radialInnerFraction` (number, default `0`, range 0 to 1); `polarLowerFraction` (number, default `0`, range 0 to 1); `azimuthalLowerFraction` (number, default `0`, range 0 to 1); `shape` (enum, default `sphere`, one of `sphere`, `cone`, `donut`).

Source: manifest `content-cd9720b3fd21.js`; view `visualization-0f563996b86c.js` → `SphericalCoordinatesVisualization`.

#### Surface level curves

Type `SURFACE_LEVEL_CURVES` · manifest v1.

Parameters: `axis` (enum, default `z`, one of `x`, `y`, `z`); `level` (number, default `1`, range -2 to 2).

Source: manifest `model-8407dd056273.js`; view `visualization-a5417bb09a24.js` → `SurfaceLevelCurvesVisualization`.

#### Tangent plane linearization: `\small f(x_0,y_0)+\nabla f(x_0,y_0)\cdot{\langle x-x_0,y-y_0\rangle}`

Type `TANGENT_PLANE_LINEARIZATION` · manifest v1 · formula `\small f(x_0,y_0)+\nabla f(x_0,y_0)\cdot{\langle x-x_0,y-y_0\rangle}`.

Parameters: `contactX` (number, default `0.65`, range -1.2 to 1.2); `contactY` (number, default `-0.45`, range -1.2 to 1.2).

Source: manifest `type-3e5d3f81a72e.js`; view `visualization-b3735802c648.js` → `TangentPlaneLinearizationVisualization`.

#### Triple integral cartesian

Type `TRIPLE_INTEGRAL_CARTESIAN`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-bf188af8fd61.js` → `CartesianTripleIntegralVisualization`.

#### Vector field curl divergence: `\begin{aligned}\operatorname{div}\mathbf F&=\nabla\cdot\mathbf F\\\operatorname{curl}\mathbf F&=\nabla\times\mathbf F\end{aligned}`

Type `VECTOR_FIELD_CURL_DIVERGENCE` · manifest v1 · formula `\begin{aligned}\operatorname{div}\mathbf F&=\nabla\cdot\mathbf F\\\operatorname{curl}\mathbf F&=\nabla\times\mathbf F\end{aligned}`.

Parameters: `field` (enum, default `rotation`, one of `source`, `sink`, `rotation`, `saddle`); `strength` (number, default `0.85`, range 0.35 to 1.45).

Source: manifest `type-2a06847ff944.js`; view `visualization-1de074e47b5d.js` → `VectorFieldCurlDivergenceVisualization`.

#### Vsepr geometry

Type `VSEPR_GEOMETRY` · manifest v1.

Parameters: `configuration` (enum, default `AX4`, one of `AX2`, `AX3`, `AX2E`, `AX4`, `AX3E`, `AX2E2`, `AX5`, `AX4E`, `AX3E2`, `AX2E3`, `AX6`, `AX5E`, `AX4E2`, `AX3E3`, `AX2E4`).

Source: manifest `model-cde8f9761457.js`; view `visualization-f34e998bd81f.js` → `VseprGeometryVisualization`.

### Lottie animations (761)

#### A and B antigen products expressed together on one AB red blood cell

Type `CODOMINANCE_ALLELE_EXPRESSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-545276c09013.js`; view `visualization-878248204896.js` → `CodominanceAlleleExpressionVisualization`.

#### A basal body anchors one motile cilium across the plasma membrane

Explain how a basal body anchors a motile cilium at the plasma membrane and how its nine microtubule triplets continue into the cilium's nine outer doublets.

Type `BASAL_BODY_CILIUM_ANCHORING` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-99041db0e99c.js`; view `visualization-8ddf26e469c4.js` → `Visualization`.

#### A biological stain reveals the same previously faint cell nucleus

Type `MICROSCOPY_STAINING_SPECIMEN_CONTRAST` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fff586ba396e.js`; view `visualization-b8b5f8c97a3c.js` → `Visualization`.

#### A competitive inhibitor occupies the substrate's own active site

Type `ENZYME_COMPETITIVE_INHIBITION_BINDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-79be525c7666.js`; view `visualization-ced1991e2601.js` → `Visualization`.

#### A complementary microRNA binds an existing mature mRNA, suppresses translation or promotes RNA degradation, and reduces protein output after transcription.

Type `MICRORNA_MRNA_TRANSLATIONAL_SILENCING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f4498f9db9f3.js`; view `visualization-6dec0e67b533.js` → `Visualization`.

#### A complementary substrate fits an enzyme's specific active site

Type `ENZYME_ACTIVE_SITE_SPECIFICITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2b7c325e1fe8.js`; view `visualization-f1f2e0b1f66c.js` → `Visualization`.

#### A confined tumor stays above an intact boundary while invasive cells cross it

Type `BENIGN_VERSUS_INVASIVE_TUMOR_BOUNDARY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4287ce92608f.js`; view `visualization-dbf00050544c.js` → `Visualization`.

#### A fixed recessive pp tester distinguishes PP from Pp dominant-phenotype parents

Type `MENDELIAN_TEST_CROSS_GENOTYPE_INFERENCE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-1bf8bcff530f.js`; view `visualization-937b41eafa8d.js` → `Visualization`.

#### A lac-operon example aligns a CAP activator site, promoter, operator, and three structural genes that share one polycistronic mRNA.

Type `PROKARYOTIC_OPERON_ARCHITECTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8a019b8d6e07.js`; view `visualization-14b90317337e.js` → `Visualization`.

#### A local developmental signal induces neighboring-cell gene expression and fate

Developmental cell-fate induction: a signaling source sends a local signal to a neighboring target cell, which activates neuronal genes and becomes a neuron while preserving its original genome.

Type `DEVELOPMENTAL_CELL_FATE_INDUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7d1f02258b02.js`; view `visualization-94ea6eb639c7.js` → `Visualization`.

#### A local regulator reaches a nearby receptor-bearing cell

A signaling cell secretes one local regulator that diffuses a short distance and activates the matching receptor of a nearby target cell.

Type `PARACRINE_CELL_SIGNALING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1276c3670217.js`; view `visualization-471630b223ac.js` → `ParacrineCellSignalingVisualization`.

#### A migratory bird follows seasonal photoperiod and resource cues

Type `SEASONAL_MIGRATION_ENVIRONMENTAL_CUES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7f09749cfe46.js`; view `visualization-ce18a758448b.js` → `SeasonalMigrationEnvironmentalCuesVisualization`.

#### A pancreas senses high glucose and a distinct effector lowers it

High blood glucose is detected by the pancreas, insulin signals an insulin-responsive skeletal muscle target, and glucose uptake lowers the same blood-glucose deviation toward normal.

Type `FEEDBACK_SENSOR_AND_EFFECTOR_ROLES` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-fbf512d18a6c.js`; view `visualization-9e72dbcd8447.js` → `FeedbackSensorAndEffectorRolesVisualization`.

#### A recognizable common precursor differentiates into nerve and muscle cells

Type `MULTICELLULAR_CELL_DIFFERENTIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ee3b981a0c54.js`; view `visualization-e299f2085cfb.js` → `Visualization`.

#### A rooted shoot bends toward directional light through growth

Type `PLANT_PHOTOTROPISM_DIRECTIONAL_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-eaa20eefe63b.js`; view `visualization-ef146d3b51cf.js` → `PlantPhototropismDirectionalGrowthVisualization`.

#### A separate allosteric inhibitor reduces catalytic capacity without occupying the active site

Type `ENZYME_NONCOMPETITIVE_INHIBITION_ALLOSTERIC` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4a167c68f228.js`; view `visualization-ca46cb9f1aef.js` → `Visualization`.

#### A short-day plant flowers after a sufficiently long uninterrupted night

Type `PLANT_PHOTOPERIOD_SEASONAL_FLOWERING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9699a92ce5d3.js`; view `visualization-7ff58c8706ff.js` → `PlantPhotoperiodSeasonalFloweringVisualization`.

#### A surface receptor responds while its water-soluble ligand stays outside

A water-soluble extracellular signal binds a cell-surface receptor without entering the cell, and the receptor-bearing target responds.

Type `CELL_SURFACE_RECEPTOR_RECOGNITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1286b1e030b2.js`; view `visualization-27ac6b42246b.js` → `CellSurfaceReceptorRecognitionVisualization`.

#### A traveling peristaltic muscle wave propels one food bolus

Digestive peristalsis animation: one intact food bolus stays within a continuous horizontal digestive lumen while circular smooth muscle contracts behind it, the segment ahead relaxes, and the same bolus moves forward without relying on gravity.

Type `ANIMAL_DIGESTIVE_PERISTALSIS_AND_FOOD_TRANSPORT` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-7e0ee9100ae8.js`; view `visualization-ceea7db85cc2.js` → `AnimalDigestivePeristalsisAndFoodTransportVisualization`.

#### ABA versus gibberellin seed dormancy

Type `ABA_VERSUS_GIBBERELLIN_SEED_DORMANCY` · manifest v1 (also v1, v1, v1) · animated thumbnail · not in the type enum.

Source: manifest `type-888603d16da6.js`; view `visualization-bc90fdb1ea92.js` → `Visualization`.

#### Abundant tryptophan binds an inactive trp repressor, enabling the complex to occupy the operator and stop tryptophan-biosynthesis transcription.

Type `TRP_OPERON_COREPRESSOR_SWITCH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-11defa77e1c6.js`; view `visualization-b29ed65690c0.js` → `Visualization`.

#### Acid strength versus concentration

Type `BIOLOGICAL_ACID_STRENGTH_VERSUS_CONCENTRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-414481fae786.js`; view `visualization-e2eff56044c3.js` → `Visualization`.

#### Acidic lysosomal digestion remains separate from near-neutral cytosol

Type `COMPARTMENT_MICROENVIRONMENTS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-e2cd7c8e14b2.js`; view `visualization-6d145a49e41a.js` → `Visualization`.

#### Acoelomate, pseudocoelomate, and coelomate

Type `ANIMAL_ACOELOMATE_PSEUDOCOELOMATE_COELOMATE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-94770f08d250.js`; view `visualization-4500d1de27bc.js` → `AnimalAcoelomatePseudocoelomateCoelomateVisualization`.

#### Actin filament polymerization

Explain how actin monomers joining a filament's barbed end can advance the adjacent plasma membrane.

Type `ACTIN_FILAMENT_POLYMERIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7e1d6c4d3594.js`; view `visualization-26a7ae8f33e0.js` → `Visualization`.

#### Actin treadmilling preserves filament length during subunit turnover

Explain actin treadmilling as barbed-end addition balanced by pointed-end loss while identifiable subunits move through an approximately constant-length filament.

Type `ACTIN_FILAMENT_TREADMILLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8bf5d00b3eb9.js`; view `visualization-8980baa6a9a9.js` → `Visualization`.

#### Actin-driven cell migration

Trace how leading-edge protrusion, new adhesion, actomyosin contraction, and rear release combine to move a cell across a substrate.

Type `ACTIN_DRIVEN_CELL_MIGRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c16e7f85108b.js`; view `visualization-62eb22e47a32.js` → `Visualization`.

#### Action-potential depolarization and repolarization

One neuronal voltage trace reaches threshold. Sodium enters through voltage-gated channels to cause depolarization; potassium leaves to cause repolarization, a brief hyperpolarizing undershoot, and return to the resting potential.

Type `ACTION_POTENTIAL_DEPOLARIZATION_AND_REPOLARIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bd392aa3db83.js`; view `visualization-620b5fedd80b.js` → `ActionPotentialDepolarizationAndRepolarizationVisualization`.

#### Activated oncogene growth signal compared with lost tumor-suppressor brake

Type `ONCOGENE_VERSUS_TUMOR_SUPPRESSOR_LOSS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bff75777a396.js`; view `visualization-dc1a1c0abf9e.js` → `Visualization`.

#### active-habitat-restoration-population-recovery

Type `ACTIVE_HABITAT_RESTORATION_POPULATION_RECOVERY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-97671b1f6834.js`; view `visualization-3989586aca35.js` → `ActiveHabitatRestorationPopulationRecoveryVisualization`.

#### Acute inflammation and neutrophil recruitment

How does acute inflammation recruit a neutrophil from blood into infected tissue? Connect local inflammatory signaling, vascular leakage, neutrophil movement out of blood vessels, and directed migration to the rapid delivery of innate defenses into infected tissue.

Type `IMMUNE_ACUTE_INFLAMMATION_NEUTROPHIL_RECRUITMENT` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-2ff2490776d8.js`; view `visualization-9de1334e151b.js` → `ImmuneAcuteInflammationNeutrophilRecruitmentVisualization`.

#### Adaptation and environmental fitness

Type `ADAPTATION_ENVIRONMENTAL_FITNESS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8978b1113585.js`; view `visualization-f9877307fb94.js` → `AdaptationEnvironmentalFitnessVisualization`.

#### Adenylyl cyclase converts ATP into intracellular cAMP that activates protein kinase A

cAMP second-messenger animation: an extracellular ligand activates a receptor and adenylyl cyclase, ATP becomes multiple intracellular cAMP molecules, and cAMP activates protein kinase A and its target.

Type `CAMP_SECOND_MESSENGER_RELAY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2595d26b3297.js`; view `visualization-3b77b3560c30.js` → `Visualization`.

#### ADH osmoregulation neuroendocrine loop

Type `ADH_OSMOREGULATION_NEUROENDOCRINE_LOOP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3727660a2c24.js`; view `visualization-5e7a1840f445.js` → `Visualization`.

#### ADH water balance negative feedback

Type `ADH_WATER_BALANCE_NEGATIVE_FEEDBACK` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2a967b7defda.js`; view `visualization-359737c1a880.js` → `AdhWaterBalanceNegativeFeedbackVisualization`.

#### Adjacent plant membranes, cellulose walls, and middle lamella

Two neighboring plant cells with plasma membranes inside separate cellulose-rich primary walls and a shared middle lamella between the walls.

Type `PLANT_CELL_WALL_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cb73f889e16d.js`; view `visualization-cbd8cefe2cbc.js` → `Visualization`.

#### Aerobic, facultative, and anaerobic bacteria share one oxygen gradient

Type `BACTERIAL_OXYGEN_REQUIREMENTS_AND_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-451f45882761.js`; view `visualization-61bf31c958f7.js` → `BacterialOxygenRequirementsAndGrowthVisualization`.

#### agricultural-nutrient-management-runoff-tradeoffs

Type `AGRICULTURAL_NUTRIENT_MANAGEMENT_RUNOFF_TRADEOFFS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5eebf8396a1b.js`; view `visualization-f2bef2432f1d.js` → `AgriculturalNutrientManagementRunoffTradeoffsVisualization`.

#### Aldehyde versus ketone carbonyl placement

Type `BIOLOGICAL_CARBONYL_ALDEHYDE_VERSUS_KETONE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-92b2050a1f27.js`; view `visualization-9347c721fc77.js` → `Visualization`.

#### Algal photosynthesis and oxygen production

Type `ALGAL_PHOTOSYNTHESIS_OXYGEN_PRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a1c7352f47a1.js`; view `visualization-7d48c409b23b.js` → `Visualization`.

#### All four DNA-template-to-RNA complementary transcription pairs

Type `DNA_TEMPLATE_RNA_COMPLEMENTARITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-20662f220b13.js`; view `visualization-ab1d607c9212.js` → `DnaTemplateRnaComplementarityVisualization`.

#### All-or-none action-potential threshold

A subthreshold stimulus produces no action potential; both threshold-level and stronger stimuli produce action-potential spikes of the same amplitude.

Type `ALL_OR_NONE_ACTION_POTENTIAL_THRESHOLD` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ba20d22de16e.js`; view `visualization-ab422c1788e1.js` → `AllOrNoneActionPotentialThresholdVisualization`.

#### Allolactose inactivates the operator-bound LacI repressor, allowing RNA polymerase to transcribe the lac structural genes.

Type `LAC_OPERON_INDUCER_REPRESSION_SWITCH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ccd61b53bbb0.js`; view `visualization-7bd12c52cfb3.js` → `Visualization`.

#### Allopatric geographic separation versus sympatric shared habitat

The upper allopatric habitat is split by a continuous river; the lower sympatric habitat remains unbroken while its populations experience a reproductive gene-flow barrier.

Type `ALLOPATRIC_VERSUS_SYMPATRIC_SPECIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-88a050f8fd8d.js`; view `visualization-be8519064ecc.js` → `AllopatricVersusSympatricSpeciationVisualization`.

#### Alpha helices and beta sheets

Type `PROTEIN_SECONDARY_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4964ed0b7591.js`; view `visualization-7c94c112c3c4.js` → `ProteinSecondaryStructureVisualization`.

#### Alternative RNA-splicing isoforms

Type `ALTERNATIVE_RNA_SPLICING_ISOFORMS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f192ed5b50f7.js`; view `visualization-7e710a89bf60.js` → `Visualization`.

#### Amino-acid carboxyl, amino, and zwitterion states

Type `BIOLOGICAL_CARBOXYL_AMINO_ZWITTERION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4574a5c56f9f.js`; view `visualization-ead86fd43c7c.js` → `Visualization`.

#### Amino-acid charge states across pH

Type `BIOLOGICAL_AMINO_ACID_PH_DEPENDENT_CHARGE_STATES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5b4c0775832e.js`; view `visualization-323039cc9257.js` → `Visualization`.

#### Amino-acid molecular structure

Type `AMINO_ACID_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-58a5e07040d8.js`; view `visualization-59473e6f1473.js` → `AminoAcidStructureVisualization`.

#### Amniotic egg and extraembryonic membranes

Amniotic egg and extraembryonic membranes: An amniotic egg encloses an embryo within a fluid-filled amnion, provides nutrients through a yolk sac, and includes an allantois extending toward the outer layer.

Type `ANIMAL_AMNIOTIC_EGG_MEMBRANES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b23f5a244906.js`; view `visualization-975b9b69c41d.js` → `AnimalAmnioticEggMembranesVisualization`.

#### Amniotic egg structure

Type `VERTEBRATE_AMNIOTIC_EGG_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ea66978c4070.js`; view `visualization-76f6a960bb64.js` → `Visualization`.

#### Amoeba phagocytosis

Type `AMOEBA_PHAGOCYTOSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f0cbe3382bff.js`; view `visualization-5e52318064f0.js` → `Visualization`.

#### An affected aa child proves both unaffected pedigree parents are Aa carriers

Type `MENDELIAN_AUTOSOMAL_RECESSIVE_PEDIGREE_CARRIER_INFERENCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4d9f48837c76.js`; view `visualization-51446ae9806f.js` → `Visualization`.

#### An affected X-linked dominant father transmits his affected X to every daughter and no son

Type `X_LINKED_DOMINANT_FATHER_DAUGHTER_TRANSMISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c705ba5329ea.js`; view `visualization-b08eca135b16.js` → `XLinkedDominantFatherDaughterTransmissionVisualization`.

#### An ectotherm cools by choosing a shaded environmental microhabitat

Type `BEHAVIORAL_THERMOREGULATION_MICROHABITAT_CHOICE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-776db5ea682f.js`; view `visualization-7800e153f011.js` → `BehavioralThermoregulationMicrohabitatChoiceVisualization`.

#### An enhancer-bound transcriptional activator loops one continuous DNA molecule toward a promoter, recruits RNA polymerase, and increases mRNA output.

Type `EUKARYOTIC_ENHANCER_PROMOTER_LOOPING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9d5acd2c2812.js`; view `visualization-c00876d46d21.js` → `Visualization`.

#### Angiosperm double fertilization

Follow two haploid sperm through one pollen tube into a flowering-plant ovule: one fuses with the haploid egg to form a diploid zygote, while the other joins two haploid polar nuclei to form triploid endosperm.

Type `ANGIOSPERM_DOUBLE_FERTILIZATION_EMBRYO_AND_ENDOSPERM` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-cbad57cb2e22.js`; view `visualization-7eec8f5ea052.js` → `AngiospermDoubleFertilizationEmbryoAndEndospermVisualization`.

#### Angiosperm flowers, fruit, and enclosed seeds

Trace one recognizable flower and its enclosed ovule through pollen landing, pollen-tube sperm delivery, fertilization, and development of that same ovary into a seed-containing fruit.

Type `ANGIOSPERM_FLOWER_FERTILIZATION_FRUIT_AND_SEEDS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-90bfb33d04c2.js`; view `visualization-5c8c6cafc81d.js` → `AngiospermFlowerFertilizationFruitAndSeedsVisualization`.

#### Animal body axes and cephalization

Type `ANIMAL_BODY_AXES_AND_CEPHALIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d16e0a53fad2.js`; view `visualization-d9834cdc341f.js` → `AnimalBodyAxesAndCephalizationVisualization`.

#### Animal cell structure and function

Type `ANIMAL_CELL_STRUCTURE_AND_FUNCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1b2e670dbd36.js`; view `visualization-a21ebdec4ed6.js` → `Visualization`.

#### Animal digestive tract organ sequence

Digestive tract anatomy with one continuous meal route from the mouth through the esophagus and stomach, into the nutrient-absorbing small intestine, and finally into the water-recovering colon.

Type `ANIMAL_DIGESTIVE_TRACT_ORGAN_SEQUENCE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-d0c6c533fe7a.js`; view `visualization-f2e9da9c909c.js` → `AnimalDigestiveTractOrganSequenceVisualization`.

#### Animal diversity and body plans

Type `ANIMAL_DIVERSITY_AND_BODY_PLANS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a683f46ddd5d.js`; view `visualization-8f82fb3739d7.js` → `AnimalDiversityAndBodyPlansVisualization`.

#### Animal excretion and osmoregulation

Type `ANIMAL_EXCRETION_AND_OSMOREGULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-913cfe23625b.js`; view `visualization-3d7795d7032c.js` → `AnimalExcretionAndOsmoregulationVisualization`.

#### Animal extracellular-matrix components and integrin attachment

Animal cell with extracellular collagen fibers, a branched proteoglycan, and fibronectin linked through a membrane-spanning integrin to intracellular actin.

Type `EXTRACELLULAR_MATRIX_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1c3c1e0e2d72.js`; view `visualization-f027f3fca8f1.js` → `Visualization`.

#### Animal respiration uses food and oxygen and releases energy and waste

An animal uses food and oxygen to release usable energy while carbon dioxide and water leave as material waste.

Type `RESPIRATION_FOOD_OXYGEN_ENERGY_WASTE_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-806e954231f8.js`; view `visualization-88f0fb9e467c.js` → `Visualization`.

#### Animal tight junctions seal, desmosomes anchor, and gap junctions connect

Two neighboring animal cells share an upper tight junction that seals, a middle desmosome that anchors intermediate filaments, and a lower gap junction that connects their cytoplasms.

Type `ANIMAL_CELL_JUNCTION_FUNCTIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6f6a8749d4cc.js`; view `visualization-a1ce95c15452.js` → `Visualization`.

#### Animal tissues, integument, and barrier repair

Type `ANIMAL_TISSUES_INTEGUMENT_AND_BARRIER_REPAIR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6e4674121c5a.js`; view `visualization-a462d68dbdb9.js` → `AnimalTissuesIntegumentAndBarrierRepairVisualization`.

#### Animal-cell cytokinesis divides cytoplasm after nuclear division

Type `ANIMAL_CELL_CYTOKINESIS_CLEAVAGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cb11e0c6fd49.js`; view `visualization-1c3f94b4c4a5.js` → `Visualization`.

#### Animal-cell swelling, balance, and shrinking across three tonicities

Type `ANIMAL_CELL_TONICITY_COMPARISON` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-f3dba7d97d54.js`; view `visualization-7a8562b7d8c5.js` → `Visualization`.

#### Annelid peristaltic locomotion

Type `ANIMAL_ANNELID_PERISTALTIC_LOCOMOTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7c7eccb9eb6a.js`; view `visualization-e9dcb20cece3.js` → `AnimalAnnelidPeristalticLocomotionVisualization`.

#### Ant pheromone trail and food recruitment

Type `ANIMAL_PHEROMONE_TRAIL_RECRUITMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-af499b718fd6.js`; view `visualization-2aba90eefe4c.js` → `Visualization`.

#### Antagonistic elbow flexion and extension

Type `MUSCULOSKELETAL_ANTAGONISTIC_ELBOW_FLEXION_EXTENSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2997e16bf52b.js`; view `visualization-e6971a23f156.js` → `MusculoskeletalAntagonisticElbowFlexionExtensionVisualization`.

#### Antibiotic selection of resistant bacteria

Type `ANTIBIOTIC_SELECTION_RESISTANT_BACTERIA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-802b4dd6e13b.js`; view `visualization-e16e165ea716.js` → `AntibioticSelectionResistantBacteriaVisualization`.

#### Antibody heavy chains, light chains, Fab, and Fc

How do an antibody's heavy and light chains create Fab binding arms and an Fc effector stem? Relate the two heavy chains and two light chains of an antibody monomer to its identical Fab antigen-binding sites, flexible hinge, and heavy-chain Fc effector region.

Type `ANTIBODY_HEAVY_LIGHT_CHAIN_FAB_FC_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-40eeb111c0e1.js`; view `visualization-3c599b2e2e0b.js` → `AntibodyHeavyLightChainFabFcStructureVisualization`.

#### Antibody specificity and neutralization

Why does only a matching antibody block viral attachment? Explain how antigen-binding specificity allows a matching antibody to neutralize an extracellular virion by occupying a required host-attachment site.

Type `ANTIBODY_SPECIFICITY_AND_ANTIGEN_NEUTRALIZATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-ea3f8f53184e.js`; view `visualization-36a0b47d187c.js` → `AntibodySpecificityAndAntigenNeutralizationVisualization`.

#### Antigen presentation pathways

Why do MHC I and MHC II activate different T cells? Distinguish endogenous peptide presentation by MHC class I to CD8 cytotoxic T cells from exogenous peptide presentation by MHC class II to CD4 helper T cells.

Type `ANTIGEN_PRESENTATION_PATHWAYS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-97e3fb15672b.js`; view `visualization-3686bf93de78.js` → `AntigenPresentationPathwaysVisualization`.

#### Antigen-specific clonal selection and expansion

How does one antigen select and expand its matching lymphocyte clone? Explain why only an antigen-matched lymphocyte undergoes clonal expansion and differentiates into effector and memory descendants with the same specificity.

Type `ANTIGEN_SPECIFIC_CLONAL_SELECTION_AND_EXPANSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-982dd19b2dc9.js`; view `visualization-14c4f22faac9.js` → `AntigenSpecificClonalSelectionAndExpansionVisualization`.

#### Antiparallel AUG codon and UAC tRNA anticodon pairing

Type `CODON_ANTICODON_PAIRING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9769188bb6a1.js`; view `visualization-a522e6b0a3c1.js` → `CodonAnticodonPairingVisualization`.

#### Antiparallel DNA strands

Two complementary DNA strands run antiparallel through a twisting double helix: one strand runs from 5-prime to 3-prime while its partner runs from 3-prime to 5-prime.

Type `ANTIPARALLEL_DNA_STRANDS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cfba3c82c3af.js`; view `visualization-5b2e73a4d102.js` → `Visualization`.

#### Antiparallel template and daughter polarity

Type `DNA_REPLICATION_ANTIPARALLEL_TEMPLATE_POLARITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-51b2e3398223.js`; view `visualization-bb9d0fa727f2.js` → `DnaReplicationAntiparallelTemplatePolarityVisualization`.

#### Apical dominance auxin and cytokinin

Type `APICAL_DOMINANCE_AUXIN_CYTOKININ` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6c3282e07d05.js`; view `visualization-4e08d14e012a.js` → `Visualization`.

#### Artery, vein, and capillary structure comparison

Static vessel comparison: an artery has a thick wall and narrower lumen, a vein has a thinner wall, wider lumen, and one-way valve, and a capillary has a thin exchange wall beside a body cell.

Type `ANIMAL_ARTERY_VEIN_CAPILLARY_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-652df7b8cca1.js`; view `visualization-977e9b1974c5.js` → `AnimalArteryVeinCapillaryStructureVisualization`.

#### Arthropod body plan and jointed appendages

Type `ANIMAL_ARTHROPOD_BODY_PLAN_JOINTED_APPENDAGES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-153bd2ef9e5e.js`; view `visualization-a1dc29055a6a.js` → `AnimalArthropodBodyPlanJointedAppendagesVisualization`.

#### Artificial selection and selective breeding

Type `ARTIFICIAL_SELECTION_SELECTIVE_BREEDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-942f711e0087.js`; view `visualization-fe8d8d759cf0.js` → `ArtificialSelectionSelectiveBreedingVisualization`.

#### Asexual plant propagation by runners

A parent flowering plant extends a horizontal above-ground runner, roots form at its node, and a connected new daughter plant grows without pollination or seed formation

Type `PLANT_ASEXUAL_RUNNER_PROPAGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2c26d444906d.js`; view `visualization-7fb2802a7e8b.js` → `Visualization`.

#### Asymmetric stem-cell division renews one stem cell and differentiates its sibling

Asymmetric stem-cell division and self-renewal: one stem cell produces a daughter that retains stem-cell identity and a sibling that differentiates into a neuron, while both daughters inherit the same genome.

Type `STEM_CELL_ASYMMETRIC_DIVISION_AND_SELF_RENEWAL` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-689b3aa08e59.js`; view `visualization-3be47f20bdeb.js` → `Visualization`.

#### Atmospheric nitrogen, root-nodule bacteria, soil nitrogen, and feeding

How does atmospheric nitrogen become available to plants and then enter animals? Explain that nitrogen-fixing microbes convert atmospheric nitrogen gas into biologically available soil nitrogen before producers assimilate it and consumers acquire it by feeding.

Type `BIOGEOCHEMICAL_NITROGEN_FIXATION_AND_ASSIMILATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-54c26514e9b7.js`; view `visualization-25486836ab20.js` → `Visualization`.

#### ATP and ADP preserve adenosine while one phosphate changes attachment

ATP and ADP structure comparison: both molecules retain the same adenosine scaffold; ATP has three attached phosphate groups, while ADP has two and a separate conserved inorganic phosphate.

Type `ATP_ADP_PHOSPHATE_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fb2a1f973b3d.js`; view `visualization-63813cad048f.js` → `AtpAdpPhosphateStructureVisualization`.

#### ATP hydrolysis transfers one phosphate and metabolic energy regenerates ATP

ATP hydrolysis and regeneration animation: one conserved terminal phosphate leaves ATP as cellular work occurs, then energy input returns that same phosphate to ADP and regenerates ATP.

Type `ATP_HYDROLYSIS_AND_REGENERATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8300643c305a.js`; view `visualization-ba8bf6029eea.js` → `AtpHydrolysisAndRegenerationVisualization`.

#### ATP phosphorylation activates a substrate and enables a new chemical bond

ATP-coupled chemical work animation: the same terminal ATP phosphate transfers to a substrate, creating an activated intermediate that enables a new product bond.

Type `PHOSPHORYLATION_COUPLED_CELLULAR_WORK` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2d1673cb9409.js`; view `visualization-3bd433dbe3dc.js` → `PhosphorylationCoupledCellularWorkVisualization`.

#### ATP synthase chemiosmosis

Type `ATP_SYNTHASE_CHEMIOSMOSIS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-6cbf6f94a417.js`; view `visualization-a50fd45cc624.js` → `AtpSynthaseChemiosmosisVisualization`.

#### ATP-dependent cross-bridge cycle

Type `MUSCULOSKELETAL_ATP_CROSS_BRIDGE_CYCLE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-39a8560c3bfb.js`; view `visualization-cfeeccd32dc4.js` → `MusculoskeletalAtpCrossBridgeCycleVisualization`.

#### ATP-derived phosphate activates a membrane pump before against-gradient ion transport

ATP-driven active transport animation: ATP-derived phosphate activates a membrane pump, then one identifiable ion moves through its pore from lower concentration to higher concentration.

Type `ATP_DRIVEN_ACTIVE_TRANSPORT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c7ea28e4ea8e.js`; view `visualization-938c517e8fcb.js` → `AtpDrivenActiveTransportVisualization`.

#### Auditory hair-cell sensory transduction

Type `SENSORY_AUDITORY_HAIR_CELL_TRANSDUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9870c8ab5420.js`; view `visualization-921566591f19.js` → `Visualization`.

#### Autophagy encloses damaged cargo for lysosomal recycling

Type `AUTOPHAGY_LYSOSOME_RECYCLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-678887ccf7d8.js`; view `visualization-32231d418006.js` → `Visualization`.

#### Autosomal dominant vertical transmission contrasted with recessive transmission through an unaffected carrier generation

Type `MENDELIAN_AUTOSOMAL_DOMINANT_VERSUS_RECESSIVE_PEDIGREE_PATTERNS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8f7ed7ae3194.js`; view `visualization-1b93872e5077.js` → `Visualization`.

#### Autosomal father-to-son transmission contrasted with paternal X-to-daughter transmission

Type `MENDELIAN_AUTOSOMAL_VERSUS_X_LINKED_PEDIGREE_TRANSMISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-71af11eb5df9.js`; view `visualization-ced632066bcf.js` → `Visualization`.

#### Auxin acid-growth cell elongation

Type `AUXIN_ACID_GROWTH_CELL_ELONGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1805cba087c8.js`; view `visualization-fbec65cf3734.js` → `Visualization`.

#### B-cell plasma-cell antibody secretion

How does an activated B cell produce protective antibodies? Connect antigen-specific B-cell activation to plasma-cell differentiation and secretion of antibodies with the same recognition specificity.

Type `B_CELL_PLASMA_CELL_ANTIBODY_SECRETION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b5c2097cd130.js`; view `visualization-f13114d98710.js` → `BCellPlasmaCellAntibodySecretionVisualization`.

#### Bacterial and animal cells share core structures but differ in nuclear organization

Bacterial and animal cells both have a membrane, cytoplasm, DNA, and ribosomes. Bacterial DNA is not enclosed in a nucleus, while animal-cell DNA is enclosed within a nucleus.

Type `CELL_THEORY_PROKARYOTIC_AND_EUKARYOTIC_CELLS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2984118d783e.js`; view `visualization-94dd1f93c5d4.js` → `Visualization`.

#### Bacterial batch-culture growth phases

Type `BACTERIAL_BATCH_CULTURE_GROWTH_PHASES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f5bd8d82824c.js`; view `visualization-bbdb6fff1f3b.js` → `BacterialBatchCultureGrowthPhasesVisualization`.

#### Bacterial binary fission

Type `BACTERIAL_BINARY_FISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-22c63a9cd888.js`; view `visualization-9641d61357aa.js` → `BacterialBinaryFissionVisualization`.

#### Bacterial cell envelope and accessory structures

Type `BACTERIAL_CELL_ENVELOPE_AND_ACCESSORY_STRUCTURES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a79469a0080a.js`; view `visualization-6f59101e5f54.js` → `BacterialCellEnvelopeAndAccessoryStructuresVisualization`.

#### Bacterial cell shapes and arrangements

Type `BACTERIAL_CELL_SHAPES_AND_ARRANGEMENTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ba757dc9e400.js`; view `visualization-b5647d2ab843.js` → `BacterialCellShapesAndArrangementsVisualization`.

#### Bacterial conjugation and plasmid transfer

Type `BACTERIAL_CONJUGATION_PLASMID_TRANSFER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-da50844dbb13.js`; view `visualization-ae3d266a680e.js` → `BacterialConjugationPlasmidTransferVisualization`.

#### Bacterial horizontal gene transfer routes

Type `BACTERIAL_HORIZONTAL_GENE_TRANSFER_ROUTES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4842463d2b9c.js`; view `visualization-ecf923aa7d39.js` → `BacterialHorizontalGeneTransferRoutesVisualization`.

#### Bacterial operons and eukaryotic chromatin, transcription, and RNA processing regulate the unchanged pathway from DNA to RNA to protein.

Type `GENE_EXPRESSION_REGULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5205086ad8f2.js`; view `visualization-9807cd426072.js` → `Visualization`.

#### Bacterial population density triggers a shared quorum-sensing response

Type `BACTERIAL_QUORUM_SENSING_DENSITY_THRESHOLD` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-c03b23303f20.js`; view `visualization-820f553e9d4a.js` → `BacterialQuorumSensingDensityThresholdVisualization`.

#### Bacterial prophage induction

Type `BACTERIAL_PROPHAGE_INDUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-58c4175b99e7.js`; view `visualization-c2bf832f6263.js` → `BacterialProphageInductionVisualization`.

#### Bacterial transformation and antibiotic selection

Two comparable bacterial hosts face equal visibly counted antibiotic doses; only the plasmid-positive cell contains the marked resistance gene and survives, while the plasmid-negative host is inhibited.

Type `BACTERIAL_TRANSFORMATION_ANTIBIOTIC_SELECTION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-1a2c38f9cd50.js`; view `visualization-529edf6e3ead.js` → `Visualization`.

#### Bacterial transformation and free DNA uptake

Type `BACTERIAL_TRANSFORMATION_FREE_DNA_UPTAKE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-42af29e28dc1.js`; view `visualization-4db94745cedc.js` → `BacterialTransformationFreeDnaUptakeVisualization`.

#### Bacteriophage attachment and genome injection

Type `BACTERIOPHAGE_ATTACHMENT_AND_GENOME_INJECTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-10a9f2c0fc13.js`; view `visualization-3ba49309f148.js` → `BacteriophageAttachmentAndGenomeInjectionVisualization`.

#### Bacteriophage lysogeny and prophage inheritance

Type `BACTERIOPHAGE_LYSOGENY_AND_PROPHAGE_INHERITANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-909470642d06.js`; view `visualization-1f7a9958aa38.js` → `BacteriophageLysogenyAndProphageInheritanceVisualization`.

#### Bacteriophage lytic replication and lysis

Type `BACTERIOPHAGE_LYTIC_REPLICATION_AND_LYSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3d08c7be808d.js`; view `visualization-5560d169197b.js` → `BacteriophageLyticReplicationAndLysisVisualization`.

#### Bacteriophage lytic versus lysogenic pathways

Type `BACTERIOPHAGE_LYTIC_VERSUS_LYSOGENIC_PATHWAYS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-ffec32f63499.js`; view `visualization-17c48051eb6e.js` → `BacteriophageLyticVersusLysogenicPathwaysVisualization`.

#### Bacteriophage structure and host recognition

Type `BACTERIOPHAGE_STRUCTURE_AND_HOST_RECOGNITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ab95f7c62d15.js`; view `visualization-29ad52ff8e58.js` → `BacteriophageStructureAndHostRecognitionVisualization`.

#### Bacteriophage transduction of bacterial genes

Type `BACTERIOPHAGE_TRANSDUCTION_BACTERIAL_GENE_TRANSFER` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-77cc63d10a98.js`; view `visualization-1e2825a9b63b.js` → `BacteriophageTransductionBacterialGeneTransferVisualization`.

#### Basal melanocytes transfer protective melanin

Type `EPIDERMAL_MELANOCYTE_MELANIN_UV_PROTECTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6d75a72828bb.js`; view `visualization-d79a667795d7.js` → `EpidermalMelanocyteMelaninUvProtectionVisualization`.

#### Bidirectional replication forks

Type `DNA_REPLICATION_ORIGIN_BIDIRECTIONAL_FORKS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2eab92721c8d.js`; view `visualization-a7668db65cee.js` → `DnaReplicationOriginBidirectionalForksVisualization`.

#### Bile emulsifies fat before lipase digests exposed droplet surfaces

Fat digestion animation: bile first disperses one large fat droplet into multiple smaller droplets with greater combined surface, then lipase acts at those droplet surfaces and releases smaller digestion products; bile is not an enzyme.

Type `ANIMAL_BILE_EMULSIFICATION_AND_FAT_DIGESTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2d8109ac9cd3.js`; view `visualization-d556e8944aae.js` → `AnimalBileEmulsificationAndFatDigestionVisualization`.

#### Biological acid-base proton transfer

Type `BIOLOGICAL_ACID_BASE_PROTON_TRANSFER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9c1e4e00b6d6.js`; view `visualization-6325ad5e0671.js` → `Visualization`.

#### Biological bicarbonate buffer equilibrium

Type `BIOLOGICAL_BICARBONATE_BUFFER_EQUILIBRIUM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7be157d7b26f.js`; view `visualization-df9e225b5bc1.js` → `Visualization`.

#### Biological buffer capacity and exhaustion

Type `BIOLOGICAL_BUFFER_CAPACITY_AND_EXHAUSTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-69b19a38a764.js`; view `visualization-9b4bb195b130.js` → `Visualization`.

#### Biological buffer conjugate pair

Type `BIOLOGICAL_BUFFER_CONJUGATE_PAIR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8eeb77b86b9e.js`; view `visualization-82bfe86fdaaf.js` → `Visualization`.

#### Biological buffer response to added acid

Type `BIOLOGICAL_BUFFER_ADDED_ACID_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-64bc0103213d.js`; view `visualization-baeed2e45e61.js` → `Visualization`.

#### Biological buffer response to added base

Type `BIOLOGICAL_BUFFER_ADDED_BASE_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-acd416fdb720.js`; view `visualization-522c1acf05de.js` → `Visualization`.

#### Biological calibration curve and unknown concentration

Type `BIOLOGICAL_CALIBRATION_CURVE_AND_UNKNOWN_CONCENTRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b35c39150721.js`; view `visualization-917052a78fd7.js` → `BiologicalCalibrationCurveAndUnknownConcentrationVisualization`.

#### Biological pH scale and tenfold proton changes

Type `BIOLOGICAL_PH_SCALE_TENFOLD_PROTON_CHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-688c92b9a52f.js`; view `visualization-edde539c454c.js` → `Visualization`.

#### Biological pH, pKa, and protonation states

Type `BIOLOGICAL_PH_PKA_PROTONATION_STATES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f1b3351f62a6.js`; view `visualization-3dbc7f37474e.js` → `Visualization`.

#### Biological serial dilution and concentration

Type `BIOLOGICAL_SERIAL_DILUTION_AND_CONCENTRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7187246792b9.js`; view `visualization-2c3e7d32fd32.js` → `BiologicalSerialDilutionAndConcentrationVisualization`.

#### Biotechnology methods

One DNA-centered biotechnology map shows four countable PCR copies, three size-separated gel bands, a conspicuous donor-bearing plasmid inside a bacterial host, and a recognizable guide-directed Cas9 beside its cut DNA product.

Type `BIOTECHNOLOGY` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-ac7b8cda010c.js`; view `visualization-752cf51ab4e2.js` → `Visualization`.

#### Birds nested within reptiles

Type `VERTEBRATE_BIRDS_NESTED_WITHIN_REPTILES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-938843672aa6.js`; view `visualization-5f7525a5f4cb.js` → `Visualization`.

#### Births, deaths, immigration, and emigration

Type `POPULATION_ECOLOGY_DEMOGRAPHIC_CHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4f8dca8d977d.js`; view `visualization-f6959e1a4b1a.js` → `Visualization`.

#### Blastocyst implantation and cell lineages

Blastocyst implantation and cell lineages: A mammalian blastocyst contains an outer trophoblast, a fluid-filled cavity, and an inner cell mass. During implantation the trophoblast contacts and invades the endometrium and contributes to the fetal component of the placenta, while the inner cell mass develops into the embryo.

Type `ANIMAL_BLASTOCYST_IMPLANTATION_CELL_LINEAGES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ce928739d071.js`; view `visualization-61b393b53f4c.js` → `AnimalBlastocystImplantationCellLineagesVisualization`.

#### Both plants and animals use food and oxygen for respiration

A whole plant and a whole animal both use food and oxygen for respiration, releasing energy, carbon dioxide, and water.

Type `PLANTS_AND_ANIMALS_BOTH_RESPIRE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-919f80337893.js`; view `visualization-eaabb79cdb6f.js` → `Visualization`.

#### Branching timeline of major biological transitions

Type `BRANCHING_TIMELINE_OF_MAJOR_BIOLOGICAL_TRANSITIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-89d21841567a.js`; view `visualization-67647f262a0a.js` → `BranchingTimelineOfMajorBiologicalTransitionsVisualization`.

#### Bread mold sporangium spore release

Type `BREAD_MOLD_SPORANGIUM_SPORE_RELEASE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-47746364e6cc.js`; view `visualization-3ba4ee48bf4f.js` → `Visualization`.

#### Brightfield versus phase-contrast imaging of one unstained live cell

Type `MICROSCOPY_PHASE_CONTRAST_LIVE_CELLS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d42c0dca9d86.js`; view `visualization-d8fc48693324.js` → `Visualization`.

#### Butterfly complete metamorphosis

Butterfly complete metamorphosis: an egg becomes a caterpillar larva, then a chrysalis pupa, then an adult butterfly that produces new eggs.

Type `ORGANISM_BUTTERFLY_COMPLETE_METAMORPHOSIS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-742afae4dfb8.js`; view `visualization-ef9302551a1e.js` → `OrganismButterflyCompleteMetamorphosisVisualization`.

#### Calcium, troponin, and tropomyosin

Type `MUSCULOSKELETAL_CALCIUM_TROPONIN_TROPOMYOSIN` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3707ba102b13.js`; view `visualization-8b667a26d216.js` → `MusculoskeletalCalciumTroponinTropomyosinVisualization`.

#### Calvin cycle: carbon dioxide, RuBP, G3P, and regenerated RuBP

Type `PHOTOSYNTHESIS_CALVIN_CYCLE_CARBON_FIXATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-f142f4215cdc.js`; view `visualization-41be81c8674a.js` → `Visualization`.

#### Cambrian animal body-plan diversification

Type `CAMBRIAN_ANIMAL_BODY_PLAN_DIVERSIFICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b439c29dc06d.js`; view `visualization-cb9c20051e7e.js` → `CambrianAnimalBodyPlanDiversificationVisualization`.

#### Carbohydrate structure and function

Type `CARBOHYDRATE_STRUCTURE_FUNCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3ed86fb590b6.js`; view `visualization-fd9b631537e4.js` → `Visualization`.

#### Carbohydrates overview

Type `CARBOHYDRATES_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f11541ad36ff.js`; view `visualization-8f15538b28c5.js` → `Visualization`.

#### Carbon dioxide right-shifts the hemoglobin oxygen affinity curve

Bohr-effect comparison: normal and high-carbon-dioxide lower-pH hemoglobin saturation curves share the same axes; the high-carbon-dioxide curve shifts right, has lower saturation at one identical tissue oxygen availability, and therefore releases more oxygen to active tissue.

Type `ANIMAL_BOHR_EFFECT_AND_OXYGEN_UNLOADING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8d29529847e2.js`; view `visualization-8843dc36adbc.js` → `AnimalBohrEffectAndOxygenUnloadingVisualization`.

#### Carbon dioxide, bicarbonate transport, and blood pH

Carbon dioxide and blood-pH animation: carbon dioxide from body tissue enters blood, reversibly forms bicarbonate and a buffered hydrogen ion during transport, then bicarbonate and hydrogen ion recombine at the lungs before carbon dioxide leaves; more hydrogen ions are associated with lower pH.

Type `ANIMAL_CARBON_DIOXIDE_BICARBONATE_AND_PH` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-bebbb05ab922.js`; view `visualization-fa0e5c8d2efe.js` → `AnimalCarbonDioxideBicarbonateAndPhVisualization`.

#### Carbon from air becomes plant sugar and new leaf tissue

Carbon dioxide enters a plant leaf, and the same carbon becomes part of sugar and newly growing leaf tissue.

Type `PLANT_GROWTH_CARBON_FROM_AIR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ee194e125de6.js`; view `visualization-8f24d8e4a077.js` → `Visualization`.

#### Carbon reservoirs and fluxes

Where is carbon stored, and which pathways move it among air, organisms, soil, and water? Distinguish major carbon reservoirs from the biological and physical fluxes that transfer the same carbon among them.

Type `BIOGEOCHEMICAL_CARBON_RESERVOIRS_AND_FLUXES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3287a0c0c401.js`; view `visualization-97f2608f79b8.js` → `Visualization`.

#### carbon-budget-emission-reduction-and-sink-restoration

Type `CARBON_BUDGET_EMISSION_REDUCTION_AND_SINK_RESTORATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-319095e210a6.js`; view `visualization-b555fd0b0233.js` → `CarbonBudgetEmissionReductionAndSinkRestorationVisualization`.

#### carbon-cycle-anthropogenic-imbalance

Type `CARBON_CYCLE_ANTHROPOGENIC_IMBALANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2b6dbe275ed6.js`; view `visualization-e8277baf0b90.js` → `CarbonCycleAnthropogenicImbalanceVisualization`.

#### Carrier mother and unaffected father produce one affected X-linked son

Type `X_LINKED_RECESSIVE_INHERITANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8c8ad4f8dce7.js`; view `visualization-9a2e04ed84eb.js` → `XLinkedRecessiveInheritanceVisualization`.

#### Cell specialization: same genome, different cellular identities

Cell specialization: nerve, muscle, and protein-secretory cells share the same DNA but express different genes and have different structures and functions.

Type `CELL_SPECIALIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2848b8bd66c0.js`; view `visualization-959c4c4d3544.js` → `Visualization`.

#### Cell theory: living things, cellular units, and existing-cell lineage

Animal, plant, and bacterial cells show that all living things consist of cells and that a cell is the basic unit of life; one existing parent cell leads to two daughter cells.

Type `CELL_THEORY_EVIDENCE_AND_SCALE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5489280ca726.js`; view `visualization-8ad1b0d4b8c7.js` → `Visualization`.

#### Cell-cycle phases and regulation overview

Type `CELL_CYCLE_AND_REGULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c0c1b64d21f0.js`; view `visualization-c8236a31790e.js` → `Visualization`.

#### Cell-size surface area, volume, and SA:V comparison

Type `CELL_SIZE_SURFACE_AREA_TO_VOLUME` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-831f7c46dd63.js`; view `visualization-3cce44edd845.js` → `CellSizeSurfaceAreaToVolumeVisualization`.

#### Cell-specific transcription factors activate matching genes in the same genome

Cell-specific transcription factors: a nerve cell and muscle cell retain the same regulatory DNA, but different matching transcription factors activate different target genes.

Type `CELL_TYPE_SPECIFIC_TRANSCRIPTION_FACTORS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4f9c4bf41a5b.js`; view `visualization-1b8a9be1a573.js` → `Visualization`.

#### Cell-surface movement and cytoskeleton

Explain how actin filaments, microtubules, and intermediate filaments organize a cell and support intracellular transport and cell-surface movement.

Type `CELL_SURFACE_MOVEMENT_AND_CYTOSKELETON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6cf922fb666d.js`; view `visualization-10b91aa02070.js` → `Visualization`.

#### Cellular respiration pathway overview

Type `CELLULAR_RESPIRATION_PATHWAY_OVERVIEW` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-ac534fbf2909.js`; view `visualization-303287e721ad.js` → `CellularRespirationPathwayOverviewVisualization`.

#### Cellular structure and functions

Type `CELLULAR_STRUCTURE_AND_FUNCTIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cca2d1279025.js`; view `visualization-9a5e7492323a.js` → `Visualization`.

#### Central and peripheral nervous-system organization

The brain and spinal cord form the central nervous system. The peripheral nervous system carries sensory input inward and branches into somatic and autonomic motor output.

Type `NERVOUS_SYSTEM_CENTRAL_PERIPHERAL_ORGANIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9c47921fc211.js`; view `visualization-258d3bbb757f.js` → `NervousSystemCentralPeripheralOrganizationVisualization`.

#### Checkpoint failure inherits DNA damage through repeated cell division

Type `CHECKPOINT_FAILURE_UNCONTROLLED_PROLIFERATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8a0ed2c5e436.js`; view `visualization-63bc06948504.js` → `Visualization`.

#### Chemical-synapse neurotransmitter release

A presynaptic action potential opens a calcium channel. Calcium enters, a neurotransmitter-filled vesicle fuses with the presynaptic membrane, transmitter crosses the synaptic cleft, and a postsynaptic receptor produces a local response.

Type `CHEMICAL_SYNAPSE_NEUROTRANSMITTER_RELEASE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6d9e9c0bd954.js`; view `visualization-b8aa999387db.js` → `ChemicalSynapseNeurotransmitterReleaseVisualization`.

#### Chloroplast structure and photosynthesis

Type `CHLOROPLAST_STRUCTURE_AND_PHOTOSYNTHESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3ee19e5c3b04.js`; view `visualization-865488f9c6ab.js` → `Visualization`.

#### Cholesterol buffers cool packing and warm membrane motion

Type `CHOLESTEROL_MEMBRANE_FLUIDITY` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-fe38f4b848ea.js`; view `visualization-b3dc3ef24a56.js` → `CholesterolMembraneFluidityVisualization`.

#### Chromosome-21 nondisjunction produces a 24-chromosome gamete; fertilization by a normal 23-chromosome gamete produces trisomy 21

Type `MEIOTIC_NONDISJUNCTION_FERTILIZATION_TRISOMY` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-f023a589001e.js`; view `visualization-fa400f099d11.js` → `Visualization`.

#### Cilia versus microvilli

Distinguish motile microtubule-based cilia that move material from shorter actin-supported microvilli that increase absorptive surface area.

Type `CILIA_VERSUS_MICROVILLI` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-45f2294a8894.js`; view `visualization-e95f3b8fcd57.js` → `Visualization`.

#### Ciliary power and recovery stroke

Explain how a motile cilium's effective power stroke and bent recovery stroke create net movement of material over a cell surface.

Type `CILIARY_POWER_AND_RECOVERY_STROKE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1fc17825b632.js`; view `visualization-f40686e7f773.js` → `Visualization`.

#### Circadian melatonin neuroendocrine pathway

Type `CIRCADIAN_MELATONIN_NEUROENDOCRINE_PATHWAY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c488b3fb18f1.js`; view `visualization-43b61e8923a9.js` → `Visualization`.

#### Citric acid cycle carbon and carriers

Type `CITRIC_ACID_CYCLE_CARBON_AND_CARRIERS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-191aa237339d.js`; view `visualization-d66e65e102fb.js` → `CitricAcidCycleCarbonAndCarriersVisualization`.

#### climate-disruption-coral-bleaching

Type `CLIMATE_DISRUPTION_CORAL_BLEACHING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1eaf975bddf6.js`; view `visualization-abe18216e6cf.js` → `ClimateDisruptionCoralBleachingVisualization`.

#### climate-disruption-species-range-shift

Type `CLIMATE_DISRUPTION_SPECIES_RANGE_SHIFT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5dea8a6cd756.js`; view `visualization-901033604b25.js` → `ClimateDisruptionSpeciesRangeShiftVisualization`.

#### Cnidarian nematocyst discharge

Type `ANIMAL_CNIDARIAN_NEMATOCYST_DISCHARGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5d401172ede9.js`; view `visualization-2d43f7a5dabd.js` → `AnimalCnidarianNematocystDischargeVisualization`.

#### Cnidarian polyp versus medusa

Type `ANIMAL_CNIDARIAN_POLYP_VERSUS_MEDUSA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8ffd188b1903.js`; view `visualization-a1b5acc331d3.js` → `AnimalCnidarianPolypVersusMedusaVisualization`.

#### Cochlear tonotopic pitch mapping

Type `SENSORY_COCHLEAR_TONOTOPIC_PITCH_MAPPING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-435abf75f508.js`; view `visualization-251baa15b1a0.js` → `Visualization`.

#### Coding and template DNA strands determine transcription direction

Type `GENE_CODING_TEMPLATE_STRAND_ORIENTATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-0d5a93fdaa3f.js`; view `visualization-79f10e189f88.js` → `GeneCodingTemplateStrandOrientationVisualization`.

#### Coding strand template strand and RNA comparison

Type `CODING_TEMPLATE_RNA_STRAND_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cd83bfb62ac5.js`; view `visualization-2f47ae2ba29a.js` → `Visualization`.

#### Commensalism nesting partnership

Type `COMMENSALISM_NESTING_PARTNERSHIP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7503dd5d9f07.js`; view `visualization-a052a7e358d4.js` → `CommensalismNestingPartnershipVisualization`.

#### Comparative vertebrate embryology

Type `EVOLUTION_COMPARATIVE_EMBRYOLOGY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-615085e849cf.js`; view `visualization-d499de4c1364.js` → `EvolutionComparativeEmbryologyVisualization`.

#### Compare internal metabolic heat and external environmental heat

Type `ENDOTHERM_ECTOTHERM_HEAT_SOURCE_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c3fe6c2472a2.js`; view `visualization-3354b64ceb63.js` → `EndothermEctothermHeatSourceComparisonVisualization`.

#### Compare oriented taxis with nondirectional kinesis

Type `TAXIS_VERSUS_KINESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c3ff970cc858.js`; view `visualization-8a1516d20ec9.js` → `TaxisVersusKinesisVisualization`.

#### Compare phylogenetic relatedness

Type `PHYLOGENETIC_RELATEDNESS_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dfa112eb3084.js`; view `visualization-d025eb9c730b.js` → `Visualization`.

#### Competitive and pure noncompetitive inhibition have distinct rate limits

Type `ENZYME_INHIBITION_KINETICS_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-215b73e31187.js`; view `visualization-7530247e006a.js` → `Visualization`.

#### Complement opsonization

How do complement tags make a pathogen easier for phagocytes to recognize? Explain how deposited complement proteins opsonize a pathogen and improve recognition by a phagocyte's complement receptors.

Type `COMPLEMENT_OPSONIZATION_PHAGOCYTE_RECOGNITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2743436748f9.js`; view `visualization-a8eb1007cd73.js` → `ComplementOpsonizationPhagocyteRecognitionVisualization`.

#### Complementary base pairing

In DNA, adenine pairs specifically with thymine, and guanine pairs specifically with cytosine.

Type `COMPLEMENTARY_BASE_PAIRING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-184ee5d16a84.js`; view `visualization-e746784f02c9.js` → `Visualization`.

#### Complementary cell-surface recognition produces physical adhesion

Two animal cells approach until a branching surface carbohydrate tag recognizes a complementary binding protein, leaving their membranes physically attached through matching external molecules.

Type `CELL_SURFACE_RECOGNITION_ADHESION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4a95909092dd.js`; view `visualization-db250038936e.js` → `Visualization`.

#### Complete phosphorus reservoirs and return pathways

How do biological recycling and geological return connect one complete phosphorus cycle? Compare connected rock, soil, producer, consumer, decomposer, water, and sediment reservoirs with rapid biological and slower geological phosphate return.

Type `BIOGEOCHEMICAL_PHOSPHORUS_RESERVOIRS_AND_RETURN_PATHWAYS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a557c884f6f0.js`; view `visualization-3767f09a0d0d.js` → `Visualization`.

#### Complete versus incomplete metamorphosis

Complete metamorphosis has egg, larva, pupa, and adult butterfly; incomplete metamorphosis has egg, nymph, and adult grasshopper with no pupa.

Type `ORGANISM_COMPLETE_VERSUS_INCOMPLETE_METAMORPHOSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-43e787595df8.js`; view `visualization-a7cbcc6e9bc1.js` → `OrganismCompleteVersusIncompleteMetamorphosisVisualization`.

#### Complete water reservoirs and branching return pathways

How do atmospheric, plant, surface, and groundwater pathways form one branching water cycle? Compare evaporation, plant transpiration, precipitation, surface runoff, infiltration, and connected groundwater discharge in one complete water-cycle landscape.

Type `BIOGEOCHEMICAL_WATER_RESERVOIRS_AND_PATHWAYS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1dcba4f5b8e9.js`; view `visualization-91bd16a66b31.js` → `Visualization`.

#### Compound microscope anatomy

Type `MICROSCOPY_COMPOUND_MICROSCOPE_ANATOMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1c20da86be71.js`; view `visualization-3f42ee5b0640.js` → `Visualization`.

#### Concentration gradient and dynamic equilibrium

Type `CONCENTRATION_GRADIENT_EQUILIBRIUM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d224d9727c3f.js`; view `visualization-d41531413a90.js` → `Visualization`.

#### Connective tissue cells, fibers, and matrix

Type `ANIMAL_CONNECTIVE_TISSUE_CELLS_FIBERS_MATRIX` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fb4a17bf09e8.js`; view `visualization-4a2e7778a0bf.js` → `AnimalConnectiveTissueCellsFibersMatrixVisualization`.

#### Connective tissue matrix comparison

Type `CONNECTIVE_TISSUE_LOOSE_DENSE_ADIPOSE_BLOOD_MATRIX` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5cb90db1e742.js`; view `visualization-91c1d6648c22.js` → `ConnectiveTissueLooseDenseAdiposeBloodMatrixVisualization`.

#### Conservation population size, inherited diversity, and habitat connectivity

Type `BIODIVERSITY_CONSERVATION_POPULATION_RISK` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-87446c096512.js`; view `visualization-1c7bc8277b46.js` → `Visualization`.

#### Contained apoptotic bodies compared with accidental necrotic rupture

Type `APOPTOSIS_VERSUS_NECROSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b4b476228285.js`; view `visualization-5e5bc612f38f.js` → `Visualization`.

#### Continuous leading-strand synthesis

Type `DNA_REPLICATION_LEADING_STRAND_SYNTHESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4482ddc667d8.js`; view `visualization-bf6b5c38c039.js` → `DnaReplicationLeadingStrandSynthesisVisualization`.

#### Conventional pedigree symbols, connected generations, and carrier states

Type `MENDELIAN_PEDIGREE_SYMBOLS_AND_GENERATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2a06bceb3c0b.js`; view `visualization-d627bab4382f.js` → `Visualization`.

#### Convergent aquatic vertebrate body shapes

Type `VERTEBRATE_CONVERGENT_AQUATIC_BODY_SHAPES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c275a732f227.js`; view `visualization-63e44dd80b56.js` → `Visualization`.

#### Corneocytes and lipids limit epidermal water loss

Type `EPIDERMAL_CORNEOCYTES_LIPID_WATER_BARRIER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4a91b425b9ac.js`; view `visualization-8793a125375b.js` → `EpidermalCorneocytesLipidWaterBarrierVisualization`.

#### Cortical versus juxtamedullary nephron

Type `CORTICAL_VERSUS_JUXTAMEDULLARY_NEPHRON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c128a7643419.js`; view `visualization-8cf568156562.js` → `CorticalVersusJuxtamedullaryNephronVisualization`.

#### CRISPR DNA repair outcomes

One CRISPR-generated double-strand DNA break branches into an NHEJ product containing a small indel and an HDR product containing a clearly identifiable sequence copied from a homologous donor template.

Type `CRISPR_DNA_REPAIR_OUTCOMES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1cf5b0f2b9a6.js`; view `visualization-ec5ae82badcb.js` → `Visualization`.

#### CRISPR guide-directed DNA cleavage

A recognizable Cas9 protein and its guide RNA move together to an intact PAM-adjacent DNA target; Cas9 cuts both strands and remains visible beside the held double-strand break.

Type `CRISPR_GUIDE_DIRECTED_DNA_CLEAVAGE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-90d0cb4ffb61.js`; view `visualization-bf11f0ec7a23.js` → `Visualization`.

#### CRISPR-Cas9 target recognition

A recognizable folded Cas9 protein holds a guide RNA base-paired to one target DNA strand, with an intact adjacent PAM and a distinct cleavage marker upstream of that PAM.

Type `CRISPR_CAS9_TARGET_RECOGNITION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-4f238c17a2a5.js`; view `visualization-61a06fe32262.js` → `Visualization`.

#### Cytokinin divides an attached lateral bud into a leafy side shoot

Type `CYTOKININ_CELL_DIVISION_AND_BUD_GROWTH` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-abce2ea9e6f8.js`; view `visualization-cd387b1381b2.js` → `Visualization`.

#### Cytoskeletal filament comparison

Distinguish actin filaments, intermediate filaments, and microtubules by their approximate diameters, construction, and characteristic cellular roles.

Type `CYTOSKELETAL_FILAMENT_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-51b65abd2af6.js`; view `visualization-ddbfddd4f594.js` → `Visualization`.

#### Cytotoxic T-cell infected-cell killing

How does a cytotoxic T cell remove a virus-infected host cell? Follow an ordinary infected host cell through specific peptide-MHC I recognition, CD8 contact, targeted apoptosis, and disappearance of both the target and its virus while the CD8 T cell survives.

Type `CYTOTOXIC_T_CELL_INFECTED_CELL_KILLING` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-5bf56dfcdd91.js`; view `visualization-98f82f7c41fb.js` → `CytotoxicTCellInfectedCellKillingVisualization`.

#### Damaged cell undergoes contained apoptosis while its healthy neighbor survives

Type `PROGRAMMED_CELL_DEATH_APOPTOSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5d3c82dc48a7.js`; view `visualization-f9884b66a079.js` → `Visualization`.

#### Damaged DNA arrests G1 until repair permits S-phase entry

Type `G1_DNA_DAMAGE_CHECKPOINT_ARREST` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a2eb70ab697d.js`; view `visualization-f8fd9b56b06d.js` → `Visualization`.

#### Daylight entrains an approximately daily organismal activity rhythm

Type `CIRCADIAN_RHYTHM_LIGHT_ENTRAINMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8361d3883c3e.js`; view `visualization-b946d3b88910.js` → `CircadianRhythmLightEntrainmentVisualization`.

#### Decomposer nutrient recycling

Type `DECOMPOSER_NUTRIENT_RECYCLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6bc6cf95ae61.js`; view `visualization-9c54c081e7ef.js` → `Visualization`.

#### Deep time and the Precambrian–Phanerozoic scale

Type `GEOLOGIC_DEEP_TIME_PRECAMBRIAN_PHANEROZOIC_SCALE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a3f39ff38550.js`; view `visualization-5f937b19fd7e.js` → `GeologicDeepTimePrecambrianPhanerozoicScaleVisualization`.

#### Dendritic-cell antigen presentation

How does a dendritic cell activate a helper T cell? Explain how an antigen-presenting dendritic cell links innate pathogen capture to adaptive helper-T-cell activation through a specific peptide-MHC II complex.

Type `DENDRITIC_CELL_ANTIGEN_PRESENTATION_HELPER_T_CELL` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e74633664c21.js`; view `visualization-c7aa7d4cd08a.js` → `DendriticCellAntigenPresentationHelperTCellVisualization`.

#### Density-dependent population limiting factors

Type `POPULATION_ECOLOGY_DENSITY_DEPENDENT_LIMITING_FACTORS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-287064aeb533.js`; view `visualization-8c87dbace06b.js` → `Visualization`.

#### Desmosomal cadherins and intermediate filaments resist tensile stress

A desmosome links two animal cells through cadherins and intermediate filaments; outward tension pulls both cells while their mechanical attachment remains intact.

Type `DESMOSOME_CELL_ANCHORING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5cc25cdcb23a.js`; view `visualization-2a48c5f5758e.js` → `Visualization`.

#### Diaphragm-driven inhalation and quiet exhalation

Animated quiet breathing: the diaphragm descends as lung volume rises and pressure falls, drawing air inward; it then rises as lung volume falls and pressure rises, driving air outward without completely emptying the lungs.

Type `ANIMAL_DIAPHRAGM_VENTILATION_MECHANICS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-424664833bf6.js`; view `visualization-12086f5176da.js` → `AnimalDiaphragmVentilationMechanicsVisualization`.

#### Diploblastic versus triploblastic organization

Type `ANIMAL_DIPLOBLASTIC_VERSUS_TRIPLOBLASTIC_ORGANIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-979021136373.js`; view `visualization-1b28e773d4ce.js` → `AnimalDiploblasticVersusTriploblasticOrganizationVisualization`.

#### Diploid population allele-frequency bookkeeping

Type `POPULATION_GENETICS_ALLELE_FREQUENCY_BOOKKEEPING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f898c4eb601c.js`; view `visualization-e35992cab759.js` → `Visualization`.

#### Direct animal-cell communication through aligned gap junctions

One small molecule moves continuously from one animal-cell cytoplasm through paired aligned gap-junction channels into the neighboring animal-cell cytoplasm.

Type `GAP_JUNCTION_CELL_COMMUNICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c64e52121975.js`; view `visualization-c690ceb3dfd4.js` → `Visualization`.

#### Direct insect tracheal oxygen delivery

Animated insect respiration: one oxygen marker enters a spiracle, follows branching air-filled tracheae and a fine tracheole, and reaches a body cell directly without entering blood or hemolymph.

Type `ANIMAL_INSECT_TRACHEAL_GAS_DELIVERY` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-8bfdf3eae073.js`; view `visualization-73f5d301d3f8.js` → `AnimalInsectTrachealGasDeliveryVisualization`.

#### Direct membrane-stretch osmotic negative feedback

Type `OSMOTIC_NEGATIVE_FEEDBACK_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6c26ab36c0d3.js`; view `visualization-136d90fa4a35.js` → `Visualization`.

#### Direct olfactory cortical pathway

Type `SENSORY_OLFACTORY_DIRECT_CORTICAL_PATHWAY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f189b0c0b4a3.js`; view `visualization-d47a735c2efc.js` → `Visualization`.

#### Direct plant-cell communication through a plasmodesma

One small molecule moves continuously through a membrane-lined plasmodesma and around its central desmotubule from one plant-cell cytoplasm into the neighboring plant-cell cytoplasm.

Type `PLASMODESMATA_CELL_COMMUNICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ca59a08b125b.js`; view `visualization-330a997ec431.js` → `Visualization`.

#### Direct versus indirect development

Direct versus indirect development: In direct development a young animal resembles a smaller version of the adult body plan; in indirect development an anatomically distinct larva transforms through metamorphosis before reaching its adult form.

Type `ANIMAL_DIRECT_VERSUS_INDIRECT_DEVELOPMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f72842582d7b.js`; view `visualization-1499a9cd5ed1.js` → `AnimalDirectVersusIndirectDevelopmentVisualization`.

#### Direct-contact, local, and long-distance cell communication

Three cell-communication routes compare touching cells, a nearby local target, and a distant target reached through the bloodstream.

Type `CELL_COMMUNICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e353c31b65d6.js`; view `visualization-269639091c5f.js` → `CellCommunicationVisualization`.

#### Directed isopod taxis toward a favorable moisture stimulus

Type `DIRECTED_TAXIS_STIMULUS_GRADIENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-555488305e41.js`; view `visualization-d3d526f29c2f.js` → `DirectedTaxisStimulusGradientVisualization`.

#### Discontinuous Okazaki-fragment synthesis

Type `DNA_REPLICATION_LAGGING_OKAZAKI_FRAGMENTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9e7df1ab4453.js`; view `visualization-1b0915e134c4.js` → `DnaReplicationLaggingOkazakiFragmentsVisualization`.

#### Diversity of life overview

Type `DIVERSITY_OF_LIFE_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d128dc8aaacf.js`; view `visualization-8af713f36819.js` → `Visualization`.

#### DNA and RNA nucleotide comparison

DNA contains deoxyribose and thymine and usually has two strands, while RNA contains ribose and uracil and usually has one strand.

Type `DNA_RNA_NUCLEOTIDE_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d8a307b03004.js`; view `visualization-f22bc914cdd4.js` → `Visualization`.

#### DNA gene structure produces an aligned complementary RNA message

Type `DNA_AND_RNA_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4d8787b10dc9.js`; view `visualization-dd3760ae2498.js` → `DnaAndRnaStructureVisualization`.

#### DNA polymerase proofreading

Type `DNA_REPLICATION_POLYMERASE_PROOFREADING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-805e59ce7ab3.js`; view `visualization-50f44a3f424e.js` → `DnaReplicationPolymeraseProofreadingVisualization`.

#### DNA replication overview

Type `DNA_REPLICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-36cf057d68b8.js`; view `visualization-83f8d201070d.js` → `DnaReplicationVisualization`.

#### Dominant Golgi stack receives at cis and ships at trans

Type `GOLGI_APPARATUS_STRUCTURE_AND_SORTING` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-fac0216447fb.js`; view `visualization-3ce11bb0aff1.js` → `Visualization`.

#### Doubling model-cell width lowers its surface-area-to-volume ratio

A one-unit model cell has surface area 6, volume 1, and a 6-to-1 ratio. A two-unit model cell has surface area 24, volume 8, and a 3-to-1 ratio. Increasing cell size lowers the surface-area-to-volume ratio and leaves less membrane exchange area per unit volume.

Type `CELL_THEORY_SURFACE_AREA_TO_VOLUME_RATIO` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d860ae5a868e.js`; view `visualization-bba8a0420aa3.js` → `Visualization`.

#### Early-Earth prebiotic environments

Type `EARLY_EARTH_PREBIOTIC_ENVIRONMENTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-81058b95054b.js`; view `visualization-219db823513c.js` → `Visualization`.

#### Echinoderm larval-to-adult symmetry

Type `ANIMAL_ECHINODERM_LARVAL_TO_ADULT_SYMMETRY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b58fa045c9d8.js`; view `visualization-63ea3aa6865a.js` → `AnimalEchinodermLarvalToAdultSymmetryVisualization`.

#### Echinoderm water vascular tube feet

Type `ANIMAL_ECHINODERM_WATER_VASCULAR_TUBE_FEET` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e4912b15d968.js`; view `visualization-176f70a09b80.js` → `AnimalEchinodermWaterVascularTubeFeetVisualization`.

#### Ecological population density and habitat area

Type `POPULATION_ECOLOGY_DENSITY_AND_AREA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-abaf090ceac1.js`; view `visualization-a06beeaa91c8.js` → `Visualization`.

#### ecological-disturbance-secondary-succession

Type `ECOLOGICAL_DISTURBANCE_SECONDARY_SUCCESSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7c909b1a818f.js`; view `visualization-f0afd8bd177b.js` → `EcologicalDisturbanceSecondarySuccessionVisualization`.

#### Ecosystem energy flow versus matter cycling

Type `ECOSYSTEM_ENERGY_FLOW_VERSUS_MATTER_CYCLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e29ca0dd9ed3.js`; view `visualization-76cf3f376efb.js` → `Visualization`.

#### Ecosystem food web energy pathways

Type `ECOSYSTEM_FOOD_WEB_ENERGY_PATHWAYS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-99ac228d759b.js`; view `visualization-22de919da6a6.js` → `Visualization`.

#### Ecosystem primary productivity GPP and NPP

Type `ECOSYSTEM_PRIMARY_PRODUCTIVITY_GPP_NPP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b1aa2146fe45.js`; view `visualization-b796860effb7.js` → `Visualization`.

#### Ecosystem trophic energy pyramid

Type `ECOSYSTEM_TROPHIC_ENERGY_PYRAMID` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9660c42abf3b.js`; view `visualization-31e5e34e51a1.js` → `Visualization`.

#### Ecosystem trophic level hierarchy

Type `ECOSYSTEM_TROPHIC_LEVEL_HIERARCHY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-28ad22688ec0.js`; view `visualization-f36e0672a54a.js` → `Visualization`.

#### ecosystem-disturbance-food-web-cascade

Type `ECOSYSTEM_DISTURBANCE_FOOD_WEB_CASCADE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b07ef11f08ac.js`; view `visualization-2ebfe1d55a45.js` → `EcosystemDisturbanceFoodWebCascadeVisualization`.

#### Effective buffer range around pKa

Type `BIOLOGICAL_BUFFER_EFFECTIVE_PH_RANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cdcc03897190.js`; view `visualization-8cb6a4767b4f.js` → `Visualization`.

#### Electron transport chain proton pumping

Type `ELECTRON_TRANSPORT_CHAIN_PROTON_PUMPING` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-2a071fe8df9a.js`; view `visualization-698f8caba0cd.js` → `ElectronTransportChainProtonPumpingVisualization`.

#### Embryo gibberellin activates aleurone enzymes and germination

Type `GIBBERELLIN_SEED_GERMINATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-bc1e84b8d572.js`; view `visualization-92b19dad9c46.js` → `Visualization`.

#### Embryonic cleavage and blastula formation

Embryonic cleavage and blastula formation: Early cleavage is a rapid series of mitotic divisions that increases cell number without enlarging the whole embryo; subsequent organization produces a blastula containing a fluid-filled blastocoel.

Type `ANIMAL_EMBRYONIC_CLEAVAGE_BLASTULA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-13d19f969c7a.js`; view `visualization-94ca0f94bb55.js` → `AnimalEmbryonicCleavageBlastulaVisualization`.

#### Embryonic development stage sequence

Embryonic development stage sequence: After fertilization, the one-cell zygote undergoes cleavage to form a multicellular blastula. Gastrulation reorganizes cells into ectoderm, mesoderm, and endoderm, and later neurulation folds specialized ectoderm into a neural tube; these are ordered states of one developing embryo, not separate offspring.

Type `ANIMAL_EMBRYONIC_DEVELOPMENT_STAGE_SEQUENCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c840ad7d526d.js`; view `visualization-428261120c85.js` → `AnimalEmbryonicDevelopmentStageSequenceVisualization`.

#### Endocytosis and vesicle uptake

Type `ENDOCYTOSIS_VESICLE_UPTAKE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-74ea7c8761d9.js`; view `visualization-6ef63ebc998c.js` → `Visualization`.

#### Endosymbiotic origin of chloroplasts

Type `LIFE_CHLOROPLAST_ENDOSYMBIOTIC_ORIGIN` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-94f29a3fe0fe.js`; view `visualization-9c2135e580e2.js` → `Visualization`.

#### Endosymbiotic origin of mitochondria

Type `LIFE_ENDOSYMBIOTIC_ORIGIN_OF_MITOCHONDRIA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-245e5281b392.js`; view `visualization-d1f51feab9ed.js` → `Visualization`.

#### Endothermy versus ectothermy

Type `VERTEBRATE_ENDOTHERMY_VERSUS_ECTOTHERMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cca550000786.js`; view `visualization-ddb7ed983a0f.js` → `Visualization`.

#### Environmental change shifts carrying capacity

Type `POPULATION_ECOLOGY_CARRYING_CAPACITY_ENVIRONMENTAL_CHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bca3f4b3ba3b.js`; view `visualization-29f95d7b5413.js` → `Visualization`.

#### Environmental selection pressure

Type `ENVIRONMENTAL_SELECTION_PRESSURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-372842ff9913.js`; view `visualization-6bb5de5e5cf5.js` → `EnvironmentalSelectionPressureVisualization`.

#### Enzyme activity rises to a temperature optimum before denaturation

Type `ENZYME_TEMPERATURE_ACTIVITY_CURVE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-48ac00d257e0.js`; view `visualization-c973aed172a6.js` → `Visualization`.

#### Enzyme structure, active site, substrate, and products

Type `ENZYME_STRUCTURE_AND_FUNCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-67b650603009.js`; view `visualization-3b707dca88af.js` → `Visualization`.

#### Enzymes lower activation energy without changing reaction free energy

Type `ENZYME_ACTIVATION_ENERGY_PROFILE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-42aa1ee5e675.js`; view `visualization-682603636068.js` → `Visualization`.

#### Epidermal renewal and shedding

Type `EPIDERMAL_KERATINOCYTE_RENEWAL_AND_SHEDDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5ff6311826ce.js`; view `visualization-dcb744998598.js` → `EpidermalKeratinocyteRenewalAndSheddingVisualization`.

#### Epithelial apical-basal polarity

Type `EPITHELIAL_APICAL_BASAL_POLARITY_BASEMENT_MEMBRANE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f0e22c55295b.js`; view `visualization-38b26047b249.js` → `EpithelialApicalBasalPolarityBasementMembraneVisualization`.

#### Epithelial cell migration closes a wound

Type `WOUND_REEPITHELIALIZATION_CELL_MIGRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bda3eb68be5b.js`; view `visualization-c54c091d1952.js` → `WoundReepithelializationCellMigrationVisualization`.

#### Equal-time nutrient diffusion into small and large cells

Type `CELL_SIZE_DIFFUSION_PENETRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c9658a4fa072.js`; view `visualization-d03653d18270.js` → `CellSizeDiffusionPenetrationVisualization`.

#### Equal-volume compact and flattened cell surface comparison

Type `CELL_SIZE_SHAPE_EXCHANGE_SURFACE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-57068f32547f.js`; view `visualization-c18d7ebb2d13.js` → `CellSizeShapeExchangeSurfaceVisualization`.

#### Ethylene fruit ripening feedback

Type `ETHYLENE_FRUIT_RIPENING_FEEDBACK` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dd55cfa4fea1.js`; view `visualization-a346912ef01d.js` → `Visualization`.

#### Ethylene leaf abscission

Type `ETHYLENE_LEAF_ABSCISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-790391f33cd1.js`; view `visualization-4b9f94871718.js` → `Visualization`.

#### Eukaryotic flagellum propulsion

Connect a traveling bend along one eukaryotic flagellum with propulsion of its attached cell in the opposite direction.

Type `EUKARYOTIC_FLAGELLUM_PROPULSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-018087453a82.js`; view `visualization-ba8a4c3c39aa.js` → `Visualization`.

#### Eusocial colony division of labor

Type `ANIMAL_EUSOCIAL_COLONY_DIVISION_OF_LABOR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d6e90727b239.js`; view `visualization-28f426679641.js` → `Visualization`.

#### eutrophication-decomposition-oxygen-depletion

Type `EUTROPHICATION_DECOMPOSITION_OXYGEN_DEPLETION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c97aefcc55e3.js`; view `visualization-f665d5806f32.js` → `EutrophicationDecompositionOxygenDepletionVisualization`.

#### eutrophication-nutrient-runoff-algal-bloom

Type `EUTROPHICATION_NUTRIENT_RUNOFF_ALGAL_BLOOM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-371d3382c4cc.js`; view `visualization-a6d316dacf26.js` → `EutrophicationNutrientRunoffAlgalBloomVisualization`.

#### Evidence for evolution

Type `EVIDENCE_FOR_EVOLUTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e455190d0e52.js`; view `visualization-90b860671deb.js` → `EvidenceForEvolutionVisualization`.

#### Evolutionary time, fossils, and major transitions

Type `EVOLUTIONARY_TIME_FOSSILS_AND_MAJOR_TRANSITIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c64579b37e0d.js`; view `visualization-edd133a24d0a.js` → `EvolutionaryTimeFossilsAndMajorTransitionsVisualization`.

#### Excitation-contraction coupling

Type `MUSCULOSKELETAL_EXCITATION_CONTRACTION_COUPLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6b48b6e720d9.js`; view `visualization-e6090c5270ae.js` → `MusculoskeletalExcitationContractionCouplingVisualization`.

#### Excitatory versus inhibitory synapses

An excitatory synapse allows sodium entry and produces a positive graded EPSP toward threshold. An inhibitory synapse allows chloride entry and produces an inhibitory IPSP that opposes firing.

Type `EXCITATORY_VERSUS_INHIBITORY_SYNAPSES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-74fcb7e43d98.js`; view `visualization-d8b4fb9b930b.js` → `ExcitatoryVersusInhibitorySynapsesVisualization`.

#### Exocytosis and vesicle secretion

Type `EXOCYTOSIS_VESICLE_SECRETION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-883dc4ee9e3f.js`; view `visualization-cb737636d831.js` → `Visualization`.

#### Exponential population growth with abundant resources

Type `POPULATION_ECOLOGY_EXPONENTIAL_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ffd542c2ce07.js`; view `visualization-7d4613cf70cd.js` → `Visualization`.

#### Exponential versus logistic population-growth models

Type `POPULATION_ECOLOGY_EXPONENTIAL_VERSUS_LOGISTIC_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9a8bbb060c43.js`; view `visualization-e91bffce6300.js` → `Visualization`.

#### Exposed gymnosperm seeds versus enclosed angiosperm seeds

Compare gymnosperm seeds exposed on cone scales with angiosperm seeds enclosed inside an ovary-derived fruit while recognizing that both groups produce seeds.

Type `PLANT_GYMNOSPERM_VERSUS_ANGIOSPERM_SEED_ENCLOSURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-594d18be1033.js`; view `visualization-a899a7157a1a.js` → `PlantGymnospermVersusAngiospermSeedEnclosureVisualization`.

#### Facilitated diffusion through a carrier

Type `FACILITATED_DIFFUSION_CARRIER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-51ad246c8d12.js`; view `visualization-a9f7e1af3a3d.js` → `Visualization`.

#### Facilitated diffusion through a channel

Type `FACILITATED_DIFFUSION_CHANNEL` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5a9db9c8f033.js`; view `visualization-67bedd986f4c.js` → `Visualization`.

#### Female reproductive anatomy

Female reproductive anatomy: The ovaries release oocytes, uterine tubes receive them and are the usual site of fertilization, the uterus contains the lining where implantation occurs, and the cervix forms the lower uterine outlet.

Type `ANIMAL_FEMALE_REPRODUCTIVE_ANATOMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3e918a857c6f.js`; view `visualization-cfefc8e6fb62.js` → `AnimalFemaleReproductiveAnatomyVisualization`.

#### Fermentation NAD regeneration

Type `FERMENTATION_NAD_REGENERATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-bf0deb61b361.js`; view `visualization-4026a96ebb59.js` → `FermentationNadRegenerationVisualization`.

#### Fern sori, sporangia, and spores

Locate sori on a fern sporophyte frond and identify the sporangia within each sorus as structures that produce haploid spores by meiosis.

Type `FERN_SORI_SPORANGIA_AND_SPORE_PRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-92b3231a4a1e.js`; view `visualization-acb44767517f.js` → `FernSoriSporangiaAndSporeProductionVisualization`.

#### Fern sporophyte and gametophyte life cycle

Trace a dominant diploid fern sporophyte through meiosis, a haploid spore, an independent heart-shaped gametophyte, water-dependent gamete fusion, and a diploid zygote that becomes a new sporophyte.

Type `FERN_SPOROPHYTE_GAMETOPHYTE_LIFE_CYCLE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-4357ee6b3888.js`; view `visualization-55acfb24101a.js` → `FernSporophyteGametophyteLifeCycleVisualization`.

#### Fertilization and the block to polyspermy

Fertilization and the block to polyspermy: When one sperm fuses with a mammalian oocyte, egg activation triggers cortical-granule release and biochemical modification of the surrounding zona pellucida. The modified egg coat reduces binding or penetration by additional sperm, preventing polyspermy and preserving one maternal and one paternal genetic contribution.

Type `ANIMAL_FERTILIZATION_CORTICAL_BLOCK_POLYSPERMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1f935d4bac27.js`; view `visualization-3c5afe4ce4e7.js` → `AnimalFertilizationCorticalBlockPolyspermyVisualization`.

#### Fish operculum and gill ventilation

Type `VERTEBRATE_FISH_OPERCULUM_GILL_VENTILATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a73142cd456e.js`; view `visualization-a7a033c91b3c.js` → `Visualization`.

#### Fish-gill countercurrent oxygen exchange

Animated fish-gill countercurrent exchange: water and capillary blood flow in opposite directions on separate sides of a lamella, oxygen crosses repeatedly from water into blood, and the same blood becomes more oxygen-rich.

Type `ANIMAL_GILL_COUNTERCURRENT_OXYGEN_EXCHANGE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-2936b53c6479.js`; view `visualization-f6ee0d68d7c2.js` → `AnimalGillCountercurrentOxygenExchangeVisualization`.

#### Five major mass extinctions in geologic time

Type `FIVE_MAJOR_MASS_EXTINCTIONS_IN_GEOLOGIC_TIME` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5f246c089eb7.js`; view `visualization-ee3f96830c33.js` → `FiveMajorMassExtinctionsInGeologicTimeVisualization`.

#### Five-prime-to-three-prime DNA synthesis

Type `DNA_REPLICATION_FIVE_PRIME_TO_THREE_PRIME_SYNTHESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-68d8f07ee799.js`; view `visualization-aa2372763a85.js` → `DnaReplicationFivePrimeToThreePrimeSynthesisVisualization`.

#### Flatworm branched gastrovascular distribution

Type `ANIMAL_FLATWORM_BRANCHED_GASTROVASCULAR_DISTRIBUTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cf5096137673.js`; view `visualization-d122fca053c4.js` → `AnimalFlatwormBranchedGastrovascularDistributionVisualization`.

#### Florigen leaf to shoot apex

Type `FLORIGEN_LEAF_TO_SHOOT_APEX` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cfb2e291bbf8.js`; view `visualization-438e019119b2.js` → `Visualization`.

#### Flower reproductive anatomy

Flower anatomy showing pollen-producing anthers, receptive stigma, connecting style, ovary, and ovules inside the ovary

Type `PLANT_FLOWER_REPRODUCTIVE_ANATOMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-70e9046b2d2f.js`; view `visualization-f5e79cc90378.js` → `Visualization`.

#### Flower-to-fruit and ovule-to-seed development

A flower's ovary developing into a fruit while the same enclosed fertilized ovules become seeds inside it

Type `PLANT_FLOWER_TO_FRUIT_SEED_DEVELOPMENT` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-dcf56e501255.js`; view `visualization-946e4e12f1dd.js` → `Visualization`.

#### Flowering plant structure, transport, and reproduction

Flowering plant showing roots below soil, a stem, leaves, a flower, upward xylem water transport, and source-to-sink phloem sugar transport

Type `PLANT_STRUCTURE_TRANSPORT_AND_REPRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-73c45877b1bc.js`; view `visualization-aa61cc4be7e4.js` → `Visualization`.

#### Flowering-plant life cycle

Flowering-plant life cycle: a seed grows into a seedling and then a flowering adult, which produces new seeds for another generation.

Type `ORGANISM_FLOWERING_PLANT_LIFE_CYCLE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-324c515c6607.js`; view `visualization-cd25cefceff4.js` → `OrganismFloweringPlantLifeCycleVisualization`.

#### Flowering-plant life cycle

Closed flowering-plant life cycle showing a living seed, rooted seedling, mature flowering plant, bee-assisted pollination, new seeds in fruit, and dispersal back to another generation

Type `PLANT_FLOWERING_LIFE_CYCLE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-416a5b513130.js`; view `visualization-e73900e9bca4.js` → `Visualization`.

#### Focus and microscope depth of field

Type `MICROSCOPY_FOCUS_DEPTH_OF_FIELD` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d4306cc9f2f8.js`; view `visualization-61f1e434ad26.js` → `Visualization`.

#### Folded mitochondrial inner membranes localize many ATP-forming complexes

Type `ORGANELLE_MEMBRANE_SURFACE_AREA` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-453b4ad324ee.js`; view `visualization-2cce7388d869.js` → `Visualization`.

#### Food separates into nutrients that become growing body tissue

Food enters the intestine, separates into smaller nutrients, and the same food-derived matter becomes growing body tissue.

Type `FOOD_DIGESTION_TO_BUILDING_MATERIALS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cb82ca8447e5.js`; view `visualization-ae4c1a27dc3a.js` → `Visualization`.

#### Fossil strata and relative age

Type `EVOLUTION_FOSSIL_STRATA_RELATIVE_AGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9f05b607c84d.js`; view `visualization-aa1b84d06c93.js` → `EvolutionFossilStrataRelativeAgeVisualization`.

#### Fossil-age bracketing with volcanic ash

Type `FOSSIL_AGE_BRACKETING_WITH_VOLCANIC_ASH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-70f88dbb98e8.js`; view `visualization-302d6b0ce51f.js` → `FossilAgeBracketingWithVolcanicAshVisualization`.

#### Fossil-record preservation and sampling bias

Type `FOSSIL_RECORD_PRESERVATION_AND_SAMPLING_BIAS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7956eb431ee9.js`; view `visualization-f29a5e90d7c5.js` → `FossilRecordPreservationAndSamplingBiasVisualization`.

#### Fossilization through burial, mineralization, and exposure

Type `FOSSILIZATION_BURIAL_MINERALIZATION_EXPOSURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-16af45aaa5a5.js`; view `visualization-9cb5782911c6.js` → `FossilizationBurialMineralizationExposureVisualization`.

#### Founder effect and a newly established population

Type `POPULATION_GENETICS_FOUNDER_EFFECT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b44205a60514.js`; view `visualization-378f062cb890.js` → `Visualization`.

#### Four abnormal meiosis-I gametes contrast with two abnormal and two normal meiosis-II gametes

Type `MEIOTIC_NONDISJUNCTION_OUTCOME_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-730967eec15c.js`; view `visualization-2a4fca8f2b37.js` → `Visualization`.

#### Four animal tissue types

Type `ANIMAL_FOUR_TISSUE_TYPES_STRUCTURE_AND_FUNCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4bad07577538.js`; view `visualization-87e15712ed36.js` → `AnimalFourTissueTypesStructureAndFunctionVisualization`.

#### Four cells crossing a calibrated 320-micrometer microscope field

A compound light microscope reveals four similar cells spanning a 320-micrometer field diameter, so each cell is about 80 micrometers wide.

Type `CELL_THEORY_MICROSCOPE_FIELD_OF_VIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5c33e30ce081.js`; view `visualization-d4be33cf689b.js` → `Visualization`.

#### Four Pp by Pp transmission paths become 1:2:1 genotypes and 3:1 phenotypes

Type `MENDELIAN_MONOHYBRID_PHENOTYPE_RATIOS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-be85edf3a8cf.js`; view `visualization-ec0acc416900.js` → `Visualization`.

#### Four stages of skin wound repair

Type `SKIN_WOUND_HEMOSTASIS_SCAB_AND_TISSUE_REPAIR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9b2ef94680d5.js`; view `visualization-7cd01e4c7ac9.js` → `SkinWoundHemostasisScabAndTissueRepairVisualization`.

#### Fracture healing and callus formation

Type `MUSCULOSKELETAL_FRACTURE_HEALING_STAGES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c637cb0eec12.js`; view `visualization-746bfc9c0c76.js` → `MusculoskeletalFractureHealingStagesVisualization`.

#### Frameshift versus in-frame insertion

Type `MUTATION_FRAMESHIFT_VERSUS_IN_FRAME` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4bb2814e92f7.js`; view `visualization-c005b391455d.js` → `Visualization`.

#### Free bacterial cells attach and develop a protective biofilm matrix

Type `BACTERIAL_BIOFILM_FORMATION_AND_MATRIX` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-456585d3a920.js`; view `visualization-97f1a72a2d0f.js` → `BacterialBiofilmFormationAndMatrixVisualization`.

#### Freshwater fish osmoregulation

Type `FRESHWATER_FISH_OSMOREGULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-89e0028a0ec7.js`; view `visualization-5cc89980db94.js` → `FreshwaterFishOsmoregulationVisualization`.

#### Freshwater protist contractile-vacuole osmoregulation

Type `CONTRACTILE_VACUOLE_OSMOREGULATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-49d4dc985996.js`; view `visualization-49f7714fbcdc.js` → `Visualization`.

#### Freshwater versus marine fish osmoregulation

Type `FRESHWATER_VERSUS_MARINE_FISH_OSMOREGULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b63773132957.js`; view `visualization-456adb2caa3c.js` → `FreshwaterVersusMarineFishOsmoregulationVisualization`.

#### Frog metamorphosis

Frog metamorphosis: an egg becomes a tadpole, then a legged froglet with a shortening tail, then an adult frog that produces new eggs.

Type `ORGANISM_FROG_METAMORPHOSIS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-f323766213be.js`; view `visualization-2e6eef62182d.js` → `OrganismFrogMetamorphosisVisualization`.

#### Functional redundancy preserves a represented pollination role

Type `BIODIVERSITY_FUNCTIONAL_REDUNDANCY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cccc281bbee7.js`; view `visualization-c6e8be6508b6.js` → `Visualization`.

#### Functional-group polarity and water interactions

Type `BIOLOGICAL_FUNCTIONAL_GROUP_POLARITY_AND_WATER_INTERACTIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-728bb0a4c34b.js`; view `visualization-a89b7f83d60c.js` → `Visualization`.

#### Fungal decomposition and matter cycling

Type `LIFE_FUNGAL_DECOMPOSITION_AND_MATTER_CYCLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b3a0c8b50778.js`; view `visualization-4d95529e52b3.js` → `Visualization`.

#### Fungal extracellular digestion

Type `FUNGAL_EXTRACELLULAR_DIGESTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2a19f75221d6.js`; view `visualization-ec2b7f46726e.js` → `Visualization`.

#### Fungal hyphae and mycelium

Type `FUNGAL_HYPHAE_AND_MYCELIUM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bc847d169533.js`; view `visualization-707adb53cf9e.js` → `Visualization`.

#### Fungal septate and coenocytic hyphae

Type `FUNGAL_SEPTATE_AND_COENOCYTIC_HYPHAE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7771be7086de.js`; view `visualization-487fb49abe3c.js` → `Visualization`.

#### Fungal spore dispersal and germination

Type `FUNGAL_SPORE_DISPERSAL_AND_GERMINATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-540bf415710b.js`; view `visualization-54febf77952b.js` → `Visualization`.

#### G1/S, G2/M, and spindle checkpoint prerequisites

Type `CELL_CYCLE_CHECKPOINT_DECISION_MAP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-38c7b029795b.js`; view `visualization-a300f9c34ed0.js` → `Visualization`.

#### Gametophyte versus sporophyte dominance

Compare the conspicuous haploid moss gametophyte with the dominant diploid sporophytes of ferns, conifers, and flowering plants while retaining both generations in every lineage.

Type `PLANT_GAMETOPHYTE_SPOROPHYTE_DOMINANCE_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2b6de71a891e.js`; view `visualization-9098845dae0f.js` → `PlantGametophyteSporophyteDominanceComparisonVisualization`.

#### Gastrulation and three germ layers

Gastrulation and three germ layers: During gastrulation cells of an early embryo move inward and reorganize to establish the outer ectoderm, middle mesoderm, and inner endoderm, creating the layered foundation for later tissues and organs.

Type `ANIMAL_GASTRULATION_GERM_LAYER_FORMATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cbb13a39903e.js`; view `visualization-cb367f42d9c0.js` → `AnimalGastrulationGermLayerFormationVisualization`.

#### Gel electrophoresis apparatus

A recognizable top-down electrophoresis chamber frames an agarose gel with aligned wells at the negative end, a size-standard ladder, a sample lane, and the positive electrode beyond the migration path.

Type `GEL_ELECTROPHORESIS_APPARATUS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-19d92ba3f9ff.js`; view `visualization-b910ff7a03cb.js` → `Visualization`.

#### Gel electrophoresis size separation

DNA fragments labeled 900, 500, and 200 base pairs start at the same negative-electrode wells; the 200-base-pair fragment travels farthest toward the positive electrode while the 900-base-pair fragment travels least.

Type `GEL_ELECTROPHORESIS_SIZE_SEPARATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-7d3d7e57affb.js`; view `visualization-2933a1cbf2bf.js` → `Visualization`.

#### Gene flow between existing populations

Type `POPULATION_GENETICS_GENE_FLOW_MIGRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7bfc4ad9b598.js`; view `visualization-79843bd43156.js` → `Visualization`.

#### Gibberellin stem internode elongation

Type `GIBBERELLIN_STEM_INTERNODE_ELONGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-56d6af94495e.js`; view `visualization-46d3d499f8b4.js` → `Visualization`.

#### Glycolysis carbon and energy flow

Type `GLYCOLYSIS_CARBON_AND_ENERGY_FLOW` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-2042578c6082.js`; view `visualization-f0725026bee8.js` → `GlycolysisCarbonAndEnergyFlowVisualization`.

#### Glycosidic bond formation and hydrolysis

Type `GLYCOSIDIC_BOND_FORMATION_HYDROLYSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6985a3ff1284.js`; view `visualization-440e956047e4.js` → `Visualization`.

#### Gradual versus punctuated fossil change

Type `GRADUAL_VERSUS_PUNCTUATED_FOSSIL_CHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-592424351345.js`; view `visualization-4cb98053b955.js` → `GradualVersusPunctuatedFossilChangeVisualization`.

#### Gram-positive versus Gram-negative envelopes

Type `GRAM_POSITIVE_VERSUS_GRAM_NEGATIVE_ENVELOPES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-69751cc87d2a.js`; view `visualization-a442b8c6f1e9.js` → `GramPositiveVersusGramNegativeEnvelopesVisualization`.

#### Great Oxygenation and the rise of atmospheric oxygen

Type `GREAT_OXYGENATION_AND_ATMOSPHERIC_OXYGEN_RISE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-253c0912488c.js`; view `visualization-197f85ed2914.js` → `GreatOxygenationAndAtmosphericOxygenRiseVisualization`.

#### Guard-cell turgor and stomatal opening

Two guard cells take up water, bow apart as their turgor rises, and reveal an open stomatal pore between the same cells

Type `PLANT_GUARD_CELL_TURGOR_STOMATAL_OPENING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4e450da83722.js`; view `visualization-d796920c4a78.js` → `Visualization`.

#### Gymnosperm cones, pollen, and exposed seeds

Trace an initially unfertilized ovule on a recognizable conifer cone through pollen arrival and fertilization to visible seeds exposed on the same cone scales.

Type `GYMNOSPERM_CONE_POLLINATION_AND_EXPOSED_SEEDS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-ce71b0df47d1.js`; view `visualization-b63c4aa71446.js` → `GymnospermConePollinationAndExposedSeedsVisualization`.

#### habitat-fragmentation-population-isolation

Type `HABITAT_FRAGMENTATION_POPULATION_ISOLATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5a5c7e69e977.js`; view `visualization-740e6d8c697d.js` → `HabitatFragmentationPopulationIsolationVisualization`.

#### Hardy–Weinberg expected genotype frequencies

Type `POPULATION_GENETICS_HARDY_WEINBERG_EQUILIBRIUM_EXPECTATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5150123cf932.js`; view `visualization-407ad4aa5336.js` → `Visualization`.

#### Helper T-cell coordination

How can helper T cells coordinate B-cell and cytotoxic-T-cell responses? Explain that activated helper T cells coordinate both antibody-producing B-cell responses and cell-mediated cytotoxic T-cell responses through targeted signaling.

Type `HELPER_T_CELL_COORDINATES_ADAPTIVE_IMMUNITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-93747a3369c7.js`; view `visualization-82b3f086c90d.js` → `HelperTCellCoordinatesAdaptiveImmunityVisualization`.

#### Hemoglobin loads oxygen at lungs and unloads it at tissues

Hemoglobin oxygen-transport animation: oxygen moves from lung air onto one red blood cell, that same cell remains inside the blood vessel while traveling to body tissue, and the oxygen leaves the cell for the tissue.

Type `ANIMAL_HEMOGLOBIN_OXYGEN_LOADING_UNLOADING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5e4bde0a90b5.js`; view `visualization-a2353582c11f.js` → `AnimalHemoglobinOxygenLoadingUnloadingVisualization`.

#### Heritable trait variation in a population

Type `HERITABLE_TRAIT_VARIATION_POPULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a615e14ccc37.js`; view `visualization-b2b882cc43ba.js` → `HeritableTraitVariationPopulationVisualization`.

#### Hinge versus ball-and-socket motion

Type `MUSCULOSKELETAL_HINGE_VERSUS_BALL_AND_SOCKET` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-762e2335d307.js`; view `visualization-e8732c6d651b.js` → `MusculoskeletalHingeVersusBallAndSocketVisualization`.

#### Histone acetylation is associated with more open chromatin, increased promoter accessibility, RNA-polymerase recruitment, and visible mRNA production.

Type `HISTONE_ACETYLATION_CHROMATIN_OPENING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-167d63e1a2f5.js`; view `visualization-7d8668a89130.js` → `Visualization`.

#### Homologous vertebrate forelimbs

Type `EVOLUTION_HOMOLOGOUS_VERTEBRATE_FORELIMBS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e38b20b2bf6b.js`; view `visualization-b01d4d03f800.js` → `EvolutionHomologousVertebrateForelimbsVisualization`.

#### HPA axis cortisol stress response

Type `HPA_AXIS_CORTISOL_STRESS_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2f43bdec8785.js`; view `visualization-f6187bb1f6fd.js` → `Visualization`.

#### HPT axis thyroid hormone regulation

Type `HPT_AXIS_THYROID_HORMONE_REGULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7df912491cdc.js`; view `visualization-bc9e453e21dc.js` → `Visualization`.

#### human-land-use-biodiversity-loss

Type `HUMAN_LAND_USE_BIODIVERSITY_LOSS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3c23925a2cff.js`; view `visualization-e41c3a3f3ac8.js` → `HumanLandUseBiodiversityLossVisualization`.

#### Humoral versus cell-mediated immunity

How do antibody-mediated and T-cell-mediated defenses target different infections? Distinguish humoral defense against extracellular targets from cell-mediated CD8 T-cell defense against infected host cells while recognizing both as adaptive immunity.

Type `HUMORAL_VERSUS_CELL_MEDIATED_IMMUNITY` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-11a1a8a393bb.js`; view `visualization-da97c9050cf5.js` → `HumoralVersusCellMediatedImmunityVisualization`.

#### Hydrostatic skeleton, exoskeleton, and endoskeleton

Type `ANIMAL_HYDROSTATIC_EXOSKELETON_ENDOSKELETON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f77a214b3acf.js`; view `visualization-d4f135005504.js` → `AnimalHydrostaticExoskeletonEndoskeletonVisualization`.

#### Immersion oil retains light lost at a glass-to-air interface

Type `MICROSCOPY_OIL_IMMERSION_REFRACTIVE_INDEX` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-780edb36cbd7.js`; view `visualization-6647bae1f2cd.js` → `Visualization`.

#### In-frame insertion and deletion

Type `MUTATION_IN_FRAME_INDELS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-aaecd71e70d3.js`; view `visualization-ea247749876c.js` → `Visualization`.

#### Incomplete DNA replication blocks G2 until a complete chromosome can enter mitosis

Type `G2_REPLICATION_COMPLETION_CHECKPOINT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-558a29617ab5.js`; view `visualization-8d0943e2aff4.js` → `Visualization`.

#### Incomplete dominance heterozygote cross and one-to-two-to-one ratio

Type `INCOMPLETE_DOMINANCE_PHENOTYPE_RATIOS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-822c8d210de0.js`; view `visualization-9ddc92ccd8f0.js` → `IncompleteDominancePhenotypeRatiosVisualization`.

#### Incomplete versus complete digestive tract

Type `ANIMAL_INCOMPLETE_VERSUS_COMPLETE_DIGESTIVE_TRACT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-23c40861ef25.js`; view `visualization-b18375cb764a.js` → `AnimalIncompleteVersusCompleteDigestiveTractVisualization`.

#### Independent chromosome-set and DNA-content accounting through S phase and both meiotic divisions

Type `MEIOTIC_CHROMOSOME_CHROMATID_ACCOUNTING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d0a4b5e77aed.js`; view `visualization-b3e46724d25f.js` → `Visualization`.

#### Index-fossil correlation across rock layers

Type `INDEX_FOSSIL_CORRELATION_ACROSS_ROCK_LAYERS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ea30f50b04d8.js`; view `visualization-f865d35769ab.js` → `IndexFossilCorrelationAcrossRockLayersVisualization`.

#### Induced-fit binding, catalysis, product release, and enzyme reuse

Type `ENZYME_INDUCED_FIT_CATALYTIC_CYCLE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d09e20b6ac28.js`; view `visualization-81f485c25b2a.js` → `Visualization`.

#### Inherited diversity within one species

Type `BIODIVERSITY_GENETIC_DIVERSITY_WITHIN_SPECIES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7ead817c9a68.js`; view `visualization-98614b4c2fc9.js` → `Visualization`.

#### Innate versus adaptive immune response timing

How do innate and adaptive responses differ across a first and repeated infection? Distinguish the rapid broad innate response from slower antigen-specific primary adaptive activation and the faster secondary adaptive response produced by matching immune memory.

Type `INNATE_VERSUS_ADAPTIVE_IMMUNE_RESPONSE_TIMING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-53728c5f3da2.js`; view `visualization-af8c087049f2.js` → `InnateVersusAdaptiveImmuneResponseTimingVisualization`.

#### Integrin mechanically attaches extracellular matrix to actin

Extracellular fibronectin binds an integrin spanning an animal-cell membrane, completing a physical connection from collagen in the extracellular matrix to actin inside the cell.

Type `INTEGRIN_CELL_MATRIX_ADHESION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-186cbe0b107d.js`; view `visualization-467643369b6b.js` → `Visualization`.

#### Interferon antiviral signaling between cells

How does an infected cell warn nearby cells with antiviral interferon? Explain how antiviral interferon released by an infected cell induces protective gene expression in neighboring cells instead of directly destroying extracellular viruses.

Type `INTERFERON_ANTIVIRAL_SIGNALING_BETWEEN_CELLS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-afc926098422.js`; view `visualization-42bae97fddf2.js` → `InterferonAntiviralSignalingBetweenCellsVisualization`.

#### Internal versus external fertilization

Internal versus external fertilization: In internal fertilization gametes join inside the reproductive tract; in external fertilization parents release gametes into an external environment, commonly water, where fertilization occurs.

Type `ANIMAL_INTERNAL_VERSUS_EXTERNAL_FERTILIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c7ac3f150e46.js`; view `visualization-880baab2fa61.js` → `AnimalInternalVersusExternalFertilizationVisualization`.

#### Interphase growth, DNA replication, and preparation

Type `INTERPHASE_GROWTH_AND_DNA_REPLICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ce51cb96bd01.js`; view `visualization-daf6865b3d24.js` → `Visualization`.

#### Intestinal nutrient delivery through the hepatic portal vein

Animated hepatic portal circulation: one water-soluble nutrient crosses from the intestine into a blood capillary, follows the hepatic portal vein to the liver, and only then continues toward the heart.

Type `ANIMAL_HEPATIC_PORTAL_NUTRIENT_ROUTING` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-dd795f50e100.js`; view `visualization-96f7ebf97059.js` → `AnimalHepaticPortalNutrientRoutingVisualization`.

#### invasive-species-competitive-displacement

Type `INVASIVE_SPECIES_COMPETITIVE_DISPLACEMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e80de06881ec.js`; view `visualization-252ac33eaff4.js` → `InvasiveSpeciesCompetitiveDisplacementVisualization`.

#### Inverted microscope image and opposite stage movement

Type `MICROSCOPY_INVERTED_IMAGE_STAGE_MOVEMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2403f89fd437.js`; view `visualization-37f5392f5211.js` → `Visualization`.

#### IP3 opens an ER channel and previously stored calcium ions activate a response

Calcium second-messenger animation: receptor signaling produces intracellular IP3, IP3 opens an endoplasmic-reticulum channel, previously stored calcium ions enter the cytoplasm, and a calcium-sensitive response activates.

Type `CALCIUM_SECOND_MESSENGER_RELAY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ffe400528963.js`; view `visualization-bd1ec0b2d51a.js` → `Visualization`.

#### Island colonization and evolutionary biogeography

Type `EVOLUTION_BIOGEOGRAPHY_ISLAND_COLONIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3ddd1b7f2f89.js`; view `visualization-6f2876b7b573.js` → `EvolutionBiogeographyIslandColonizationVisualization`.

#### Jawless versus jawed fish

Type `VERTEBRATE_JAWLESS_VERSUS_JAWED_FISH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-eeca5948c7c2.js`; view `visualization-94d359195f77.js` → `Visualization`.

#### Kinesin and dynein vesicle transport

Compare plus-end-directed kinesin transport with minus-end-directed dynein transport on the same polarized microtubule.

Type `KINESIN_DYNEIN_VESICLE_TRANSPORT` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-432c209e1ce6.js`; view `visualization-9fec0b7a594a.js` → `Visualization`.

#### Lateral fluidity of the plasma membrane

Type `PLASMA_MEMBRANE_LATERAL_FLUIDITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-23e85f38633a.js`; view `visualization-f65d9deca116.js` → `Visualization`.

#### Leading-versus-lagging synthesis comparison

Type `DNA_REPLICATION_LEADING_LAGGING_STRAND_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a47564d8ff56.js`; view `visualization-4541d5bcc51a.js` → `DnaReplicationLeadingLaggingStrandComparisonVisualization`.

#### Leaf tissue and stomatal anatomy

Leaf cross section identifying protective epidermis, palisade and spongy mesophyll, a vein with xylem and phloem, and a stomatal pore between guard cells

Type `PLANT_LEAF_TISSUE_AND_STOMATA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-519b5b544178.js`; view `visualization-894ff50c8fbe.js` → `Visualization`.

#### Lichen fungal-algal symbiosis

Type `LICHEN_FUNGAL_ALGAL_SYMBIOSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ce2c8996ae63.js`; view `visualization-af0023fed7bb.js` → `Visualization`.

#### Life-history tradeoffs in offspring number and care

Type `POPULATION_ECOLOGY_LIFE_HISTORY_TRADEOFFS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f195fc53fca2.js`; view `visualization-1bb491b260f6.js` → `Visualization`.

#### Ligand dissociation and phosphatase-mediated phosphate removal terminate a cellular response

Signaling-termination animation: an active signal and cellular response begin together, the bound extracellular ligand dissociates, a phosphatase removes the kinase's existing phosphate, and the dependent response turns off.

Type `SIGNALING_PATHWAY_TERMINATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-056b02527aad.js`; view `visualization-5f002777c687.js` → `Visualization`.

#### Linked chromosome loci favor parental over recombinant allele combinations

Type `LINKED_GENE_INHERITANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9127482d87d3.js`; view `visualization-dd3ad4239dd6.js` → `LinkedGeneInheritanceVisualization`.

#### Lipid classes overview

Type `LIPID_CLASSES_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4d388e531655.js`; view `visualization-8a3e2ddf02b2.js` → `LipidClassesOverviewVisualization`.

#### Lipid hydrophobicity in water

Type `LIPID_HYDROPHOBICITY_IN_WATER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a315e1c4a7f6.js`; view `visualization-863ec8f31f8e.js` → `LipidHydrophobicityInWaterVisualization`.

#### Lipid tail saturation and packing

Type `LIPID_TAIL_SATURATION_PACKING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-772703df0b68.js`; view `visualization-86849ea2fccc.js` → `LipidTailSaturationPackingVisualization`.

#### Living seed: protective coat, stored food, and embryo

Inside a living seed: a protective seed coat surrounds stored food and a living plant embryo with an attached embryonic root.

Type `ORGANISM_SEED_STRUCTURE_AND_STORED_FOOD` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c8498b391a03.js`; view `visualization-7eeed6997166.js` → `OrganismSeedStructureAndStoredFoodVisualization`.

#### Lobe-fin to tetrapod limb homology

Type `VERTEBRATE_LOBE_FIN_TO_TETRAPOD_LIMB_HOMOLOGY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-edb0bb920300.js`; view `visualization-14a3204a4aa4.js` → `Visualization`.

#### Logistic population growth and carrying capacity

Type `POPULATION_ECOLOGY_LOGISTIC_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-da06ed90723c.js`; view `visualization-c2c6d65d8cce.js` → `Visualization`.

#### Long-bone growth at the growth plate

Type `MUSCULOSKELETAL_LONG_BONE_GROWTH_PLATE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-43845f929544.js`; view `visualization-e93cfdd1bd14.js` → `MusculoskeletalLongBoneGrowthPlateVisualization`.

#### Long-bone structure and function

Type `MUSCULOSKELETAL_LONG_BONE_COMPACT_SPONGY_MARROW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5f5e13b6ab5b.js`; view `visualization-2b822ecfb988.js` → `MusculoskeletalLongBoneCompactSpongyMarrowVisualization`.

#### Loop of Henle countercurrent concentration

Type `LOOP_OF_HENLE_COUNTERCURRENT_CONCENTRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bb7e74c71801.js`; view `visualization-d49aea832834.js` → `LoopOfHenleCountercurrentConcentrationVisualization`.

#### Lophotrochozoan versus ecdysozoan lineages

Type `ANIMAL_LOPHOTROCHOZOAN_VERSUS_ECDYSOZOAN_LINEAGES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1a0aea7b3410.js`; view `visualization-68d40fd01672.js` → `AnimalLophotrochozoanVersusEcdysozoanLineagesVisualization`.

#### Lymphocyte development and recirculation

How do B and T lymphocytes mature and recirculate to survey secondary lymphoid organs? Distinguish B-cell maturation in bone marrow from T-cell maturation in the thymus and trace both mature lymphocyte populations through blood and lymph to secondary lymphoid surveillance sites.

Type `LYMPHOCYTE_DEVELOPMENT_RECIRCULATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-b6d38700d2b7.js`; view `visualization-52bb5b965a85.js` → `LymphocyteDevelopmentRecirculationVisualization`.

#### Magnification versus resolving power

Type `MICROSCOPY_MAGNIFICATION_VERSUS_RESOLVING_POWER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-14ad585f6688.js`; view `visualization-1be39e9b2f57.js` → `Visualization`.

#### Major animal phyla and representative body plans

Type `ANIMAL_MAJOR_PHYLA_AND_BODY_PLAN_TRAITS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-61ce21314989.js`; view `visualization-ea995afaca37.js` → `AnimalMajorPhylaAndBodyPlanTraitsVisualization`.

#### Male reproductive anatomy and sperm route

Male reproductive anatomy and sperm route: Sperm form in the testes, mature in the epididymis, travel through the vas deferens, join secretions from accessory glands near the prostate, and leave through the urethra; the urinary bladder is a nearby landmark, not the source of sperm.

Type `ANIMAL_MALE_REPRODUCTIVE_ANATOMY_SPERM_ROUTE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-52d53df3c9e7.js`; view `visualization-e10ad0116bbd.js` → `AnimalMaleReproductiveAnatomySpermRouteVisualization`.

#### Mammalian airway, lungs, and alveolar exchange anatomy

Mammalian respiratory anatomy: one trachea branches into both recognizable lungs and connects to enlarged alveoli, where oxygen crosses from air into pulmonary blood and carbon dioxide crosses back into alveolar air.

Type `ANIMAL_RESPIRATORY_AIRWAY_AND_LUNG_ANATOMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e72cfd1bca46.js`; view `visualization-e0aa989194a6.js` → `AnimalRespiratoryAirwayAndLungAnatomyVisualization`.

#### Mammalian pulmonary and systemic double circulation

Mammalian double circulation: the pulmonary circuit carries oxygen-poor blood from the right heart to the lungs and returns oxygen-rich blood to the left heart, while the systemic circuit carries it to body tissues and returns oxygen-poor blood to the right heart.

Type `ANIMAL_PULMONARY_AND_SYSTEMIC_CIRCULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c64ab2df2499.js`; view `visualization-a57957651e21.js` → `AnimalPulmonaryAndSystemicCirculationVisualization`.

#### Mammalian urinary system anatomy

Type `MAMMALIAN_URINARY_SYSTEM_ANATOMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9183bd73705b.js`; view `visualization-5c985aa90640.js` → `MammalianUrinarySystemAnatomyVisualization`.

#### Marine fish osmoregulation

Type `MARINE_FISH_OSMOREGULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c550cf95a1b9.js`; view `visualization-95f8243d8e55.js` → `MarineFishOsmoregulationVisualization`.

#### Mass-extinction survival and adaptive radiation

Type `MASS_EXTINCTION_SURVIVAL_AND_ADAPTIVE_RADIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8f0079451279.js`; view `visualization-dee6bb6b9cb8.js` → `MassExtinctionSurvivalAndAdaptiveRadiationVisualization`.

#### Matched heterozygotes distinguish uniform blending from codominance

Type `INCOMPLETE_DOMINANCE_VERSUS_CODOMINANCE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-a0ef520456c3.js`; view `visualization-f4feb4984342.js` → `IncompleteDominanceVersusCodominanceVisualization`.

#### Maternal allele silencing makes the same nuclear variant depend on its parent of origin

Type `GENOMIC_IMPRINTING_PARENT_OF_ORIGIN` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f8aac9842be6.js`; view `visualization-f933a08869d3.js` → `GenomicImprintingParentOfOriginVisualization`.

#### Maternal mitochondrial transmission compared with no paternal transmission

Type `MITOCHONDRIAL_MATERNAL_INHERITANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9cc835a152fb.js`; view `visualization-ee206fee98e8.js` → `MitochondrialMaternalInheritanceVisualization`.

#### Matter cycles while energy flows

Why can atoms cycle through an ecosystem while usable energy must enter and leave? Distinguish conserved cycling matter from usable energy that enters as sunlight and leaves organisms as dispersed heat.

Type `BIOGEOCHEMICAL_MATTER_CYCLING_VERSUS_ENERGY_FLOW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f76c55fd1b22.js`; view `visualization-358c8fe7c37d.js` → `Visualization`.

#### Mature mRNA structure

Type `MATURE_MRNA_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-49869326c395.js`; view `visualization-f37bf12f0b8b.js` → `Visualization`.

#### Measured image size, actual specimen size, and magnification

Type `MICROSCOPY_IMAGE_SIZE_ACTUAL_SIZE_MAGNIFICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-aa7e4e9c7882.js`; view `visualization-3334cc8579ef.js` → `Visualization`.

#### Measurement accuracy and precision

Type `BIOLOGICAL_MEASUREMENT_ACCURACY_AND_PRECISION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8b3293eb3b2f.js`; view `visualization-f4533fa34250.js` → `BiologicalMeasurementAccuracyAndPrecisionVisualization`.

#### Meiosis I separates intact replicated homologs and reduces diploid cells to haploid

Type `HOMOLOGOUS_CHROMOSOME_SEGREGATION_MEIOSIS_ONE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4fd95528f685.js`; view `visualization-d7a18dd31f8a.js` → `Visualization`.

#### Meiosis II separates sister chromatids while preserving one haploid chromosome set

Type `SISTER_CHROMATID_SEGREGATION_MEIOSIS_TWO` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1933f57a34c9.js`; view `visualization-0eac2a2a596f.js` → `Visualization`.

#### Meiosis-I nondisjunction sends both homologs together and produces four abnormal gametes

Type `MEIOSIS_ONE_NONDISJUNCTION_SEGREGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-46c3ec3902e8.js`; view `visualization-ccd9ba9e8738.js` → `Visualization`.

#### Meiosis-II nondisjunction in one branch leaves two normal and two abnormal gametes

Type `MEIOSIS_TWO_NONDISJUNCTION_SEGREGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8520cf5c3419.js`; view `visualization-b86b87566eff.js` → `Visualization`.

#### Membrane bilayer polarity

Type `MEMBRANE_BILAYER_POLARITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-549b648a502a.js`; view `visualization-1ecf98d1df42.js` → `MembraneBilayerPolarityVisualization`.

#### Membrane-bound compartments within one eukaryotic cell

Type `CELLULAR_COMPARTMENTALIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-47e4ca3ded08.js`; view `visualization-5e7252d80ce6.js` → `Visualization`.

#### Membrane-bound ligand signals a touching neighboring cell

A membrane-bound ligand on one cell binds the matching receptor of a touching neighbor, and only that target cell responds.

Type `DIRECT_CONTACT_CELL_SIGNALING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d8a0405176cd.js`; view `visualization-15b2aabcaf4f.js` → `DirectContactCellSignalingVisualization`.

#### Mendelian garden-pea P, F1, and F2 inheritance overview

Type `MENDELIAN_GENETICS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-9cd861e080d5.js`; view `visualization-82827faf68b3.js` → `Visualization`.

#### Metamorphosis from larva to adult

Metamorphosis from larva to adult: A frog develops from an aquatic tadpole into a froglet as limbs emerge and the tail recedes; the resulting adult frog has a different body plan and no larval tail.

Type `ANIMAL_METAMORPHOSIS_LARVA_TO_ADULT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c0c9f0d5ebec.js`; view `visualization-686372254f47.js` → `AnimalMetamorphosisLarvaToAdultVisualization`.

#### Microscope illumination and image path

Type `MICROSCOPY_ILLUMINATION_TO_EYEPIECE_PATH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3c830228c3fc.js`; view `visualization-9811488777c5.js` → `Visualization`.

#### Microscopy scale bar cell measurement

Type `MICROSCOPY_SCALE_BAR_CELL_MEASUREMENT` · manifest v1 · not in the type enum.

Source: manifest `type-e95d6b1ca1f3.js`; view `visualization-bec74e400b4a.js` → `Visualization`.

#### Microtubule polarity and growth

Explain how tubulin dimers add preferentially at a microtubule plus end while its minus end remains associated with the organizing center.

Type `MICROTUBULE_POLARITY_AND_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8b1bee59d525.js`; view `visualization-43f649cdcd10.js` → `Visualization`.

#### Missense amino-acid substitution

Type `MUTATION_MISSENSE_SUBSTITUTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b3afddd2f55b.js`; view `visualization-4644cc82aac8.js` → `Visualization`.

#### Mitochondrion structure and ATP production

Type `MITOCHONDRION_STRUCTURE_AND_ATP_PRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ac46f1238339.js`; view `visualization-2e0085bab352.js` → `Visualization`.

#### Molecular sequence similarity

Type `EVOLUTION_MOLECULAR_SEQUENCE_SIMILARITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ac1b1b4528e3.js`; view `visualization-9b00a1de0d27.js` → `EvolutionMolecularSequenceSimilarityVisualization`.

#### Mollusk foot modifications

Type `ANIMAL_MOLLUSK_FOOT_MODIFICATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1df450b5a80b.js`; view `visualization-634ca0e9297b.js` → `AnimalMolluskFootModificationsVisualization`.

#### Mollusk mantle, foot, and visceral mass

Type `ANIMAL_MOLLUSK_MANTLE_FOOT_VISCERAL_MASS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7142547afcd9.js`; view `visualization-90a30a49fdef.js` → `AnimalMolluskMantleFootVisceralMassVisualization`.

#### Monophyletic clade membership

Type `MONOPHYLETIC_CLADE_MEMBERSHIP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9cec470e9471.js`; view `visualization-a79dbed798a7.js` → `Visualization`.

#### Moss gametophyte and sporophyte life cycle

Trace a dominant haploid moss gametophyte through sperm-egg fusion, a diploid zygote and attached sporophyte, meiosis in its capsule, and a haploid spore that establishes a new gametophyte.

Type `MOSS_GAMETOPHYTE_SPOROPHYTE_LIFE_CYCLE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-8887b8fd3dec.js`; view `visualization-9311d7610a0f.js` → `MossGametophyteSporophyteLifeCycleVisualization`.

#### Motile cilium axoneme structure

Interpret the 9+2 axonemal arrangement of nine outer microtubule doublets surrounding a central microtubule pair and identify dynein arms.

Type `MOTILE_CILIUM_AXONEME_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-30de38936a0c.js`; view `visualization-46097015b30c.js` → `Visualization`.

#### Motor-unit recruitment and force

Type `MUSCULOSKELETAL_MOTOR_UNIT_RECRUITMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-eefe1b0d8c69.js`; view `visualization-5ad3bfd9b29a.js` → `MusculoskeletalMotorUnitRecruitmentVisualization`.

#### mRNA matches coding DNA except for thymine-to-uracil substitution

Type `CODING_STRAND_MRNA_SEQUENCE_RELATIONSHIP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-92ba5f9b9ddc.js`; view `visualization-7493fb290aaa.js` → `CodingStrandMrnaSequenceRelationshipVisualization`.

#### Multicellular cell, tissue, and organ hierarchy

Type `MULTICELLULAR_CELL_TISSUE_ORGAN_HIERARCHY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-eb93226f8795.js`; view `visualization-2389afbd769d.js` → `Visualization`.

#### Multiple tissues build a functional organ

Type `MULTICELLULAR_TISSUES_BUILD_ORGANS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ef89c323f7bf.js`; view `visualization-ea50fbfe0312.js` → `Visualization`.

#### Mutation codon reading frame

Type `MUTATION_CODON_READING_FRAME` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6ea333a284e9.js`; view `visualization-d3be9c3c97bb.js` → `Visualization`.

#### Mutation DNA to cellular phenotype

Type `MUTATION_DNA_RNA_PROTEIN_PHENOTYPE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-867ac10bacdb.js`; view `visualization-ee1e81847f2a.js` → `Visualization`.

#### Mutualism cleaning partnership

Type `MUTUALISM_CLEANING_PARTNERSHIP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-58a325bee689.js`; view `visualization-32402adcde57.js` → `MutualismCleaningPartnershipVisualization`.

#### Mycorrhizal mutualism

Type `MYCORRHIZAL_MUTUALISM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ba78afa4c3b9.js`; view `visualization-a1ab76eea58b.js` → `Visualization`.

#### Myelinated versus unmyelinated conduction

Equal-length axons carry equal-sized signals. The unmyelinated signal advances continuously, while the myelinated signal reaches exposed nodes and the endpoint sooner.

Type `MYELINATED_VERSUS_UNMYELINATED_CONDUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cd97efba78f5.js`; view `visualization-ecd3412e1ad1.js` → `MyelinatedVersusUnmyelinatedConductionVisualization`.

#### Natural killer cell missing-self recognition

How does a natural killer cell detect an infected cell that has lost MHC I? Explain how natural killer cells preserve healthy MHC-I-positive host cells while recognizing reduced self-MHC I as one trigger for innate killing of an infected or abnormal cell.

Type `NATURAL_KILLER_CELL_MISSING_SELF_RECOGNITION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-a79320848a80.js`; view `visualization-2053c9a7bff3.js` → `NaturalKillerCellMissingSelfRecognitionVisualization`.

#### Natural selection and differential reproduction

Type `NATURAL_SELECTION_DIFFERENTIAL_REPRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9f3be931acd6.js`; view `visualization-9ea2d003736d.js` → `NaturalSelectionDifferentialReproductionVisualization`.

#### Natural selection and differential survival

Type `NATURAL_SELECTION_DIFFERENTIAL_SURVIVAL` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b69500996b7c.js`; view `visualization-dee0140f7c98.js` → `NaturalSelectionDifferentialSurvivalVisualization`.

#### Natural selection through differential reproduction

Type `POPULATION_GENETICS_SELECTION_DIFFERENTIAL_REPRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-60e2070dd38f.js`; view `visualization-1a113f69291b.js` → `Visualization`.

#### Nephron anatomy across cortex and medulla

Type `NEPHRON_ANATOMY_CORTEX_MEDULLA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1cf35a26845a.js`; view `visualization-e52014699426.js` → `NephronAnatomyCortexMedullaVisualization`.

#### Nervous, muscular, and skeletal systems coordinate movement

Type `NERVOUS_MUSCULAR_SKELETAL_MOVEMENT` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-eceb82f62656.js`; view `visualization-f0566e1fe56f.js` → `Visualization`.

#### Nested intestinal folds, villi, and epithelial microvilli

Intestinal absorption-surface comparison: broad folds carry many finger-like villi, and one villus epithelial cell bears a dense brush border of microvilli, so the three nested structural scales together increase the surface available for nutrient absorption.

Type `ANIMAL_INTESTINAL_FOLDS_VILLI_AND_MICROVILLI` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-46ee491c27f6.js`; view `visualization-ef0559dcd3de.js` → `AnimalIntestinalFoldsVilliAndMicrovilliVisualization`.

#### Neuroendocrine negative feedback

Type `NEUROENDOCRINE_NEGATIVE_FEEDBACK` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d2c67a2d1e11.js`; view `visualization-c78cca819d3e.js` → `Visualization`.

#### Neuromuscular junction transmission

Type `MUSCULOSKELETAL_NEUROMUSCULAR_JUNCTION_TRANSMISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f682a67626fb.js`; view `visualization-55692c8231b1.js` → `MusculoskeletalNeuromuscularJunctionTransmissionVisualization`.

#### Neuron anatomy and signal direction

A multipolar neuron has dendrites and a soma on the left, a continuous myelinated axon, and axon terminals on the right; a signal travels from dendrites toward terminals.

Type `NEURON_ANATOMY_AND_SIGNAL_DIRECTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-12666ffdf8fa.js`; view `visualization-5cebfc564d7d.js` → `NeuronAnatomyAndSignalDirectionVisualization`.

#### Neuronal resting potential and ion gradients

A resting neuronal membrane has more sodium outside and potassium inside. An outward potassium leak contributes to a negative interior near minus 70 millivolts.

Type `NEURONAL_RESTING_POTENTIAL_ION_GRADIENTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ca7d004370ba.js`; view `visualization-996686ef3060.js` → `NeuronalRestingPotentialIonGradientsVisualization`.

#### Neurons and muscle cells express different genes from the same genome

Differential gene expression: nerve and muscle cells contain the same genes, but each activates its own associated gene and produces its matching RNA and proteins.

Type `NEURON_VERSUS_MUSCLE_GENE_EXPRESSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b8052381e876.js`; view `visualization-84d797d77234.js` → `Visualization`.

#### Neurons, synapses, and neural circuits

A neuron sends a directional electrical signal to a chemical synapse, and connected neurons form a central sensory-to-motor neural circuit.

Type `NEURONS_SYNAPSES_AND_NEURAL_CIRCUITS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f20bb932bb7c.js`; view `visualization-5017d37a76fa.js` → `NeuronsSynapsesAndNeuralCircuitsVisualization`.

#### Neurotransmitter reuptake and synaptic clearance

A neurotransmitter leaves its postsynaptic receptor, travels back into the presynaptic terminal through a reuptake transporter, and the postsynaptic signal ends.

Type `NEUROTRANSMITTER_REUPTAKE_AND_CLEARANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7c1af0bff819.js`; view `visualization-3f56b90bf5f3.js` → `NeurotransmitterReuptakeAndClearanceVisualization`.

#### Nitrification and denitrification

How do ammonium, nitrite, and nitrate connect before nitrogen returns to the atmosphere? Distinguish nitrification's ordered ammonium-to-nitrite-to-nitrate sequence from denitrification's nitrate-to-nitrogen-gas return.

Type `BIOGEOCHEMICAL_NITROGEN_NITRIFICATION_AND_DENITRIFICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-19d786cf3a01.js`; view `visualization-2fadb87e20e6.js` → `Visualization`.

#### Nitrogen ammonification and decomposition

How do decomposers return nitrogen from organic matter to soil as ammonium? Explain that decomposers convert nitrogen in organic wastes and remains into soil ammonium through ammonification.

Type `BIOGEOCHEMICAL_NITROGEN_AMMONIFICATION_AND_DECOMPOSITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d12b6f865d56.js`; view `visualization-90d85c1ae54a.js` → `Visualization`.

#### Nitrogen reservoirs and transformations

Which nitrogen forms connect the atmosphere, organisms, and soil? Distinguish atmospheric nitrogen gas, organic nitrogen, ammonium, nitrite, and nitrate and place them in their connected cycle.

Type `BIOGEOCHEMICAL_NITROGEN_RESERVOIRS_AND_TRANSFORMATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d15ab1bb70cb.js`; view `visualization-bf0d042ec0a1.js` → `Visualization`.

#### Nonsense mutation premature stop

Type `MUTATION_NONSENSE_PREMATURE_STOP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-65285c5241d7.js`; view `visualization-7e17af4e3fdf.js` → `Visualization`.

#### Nonvascular epithelium and connective blood supply

Type `EPITHELIAL_NONVASCULAR_CONNECTIVE_TISSUE_BLOOD_SUPPLY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2553d85b2745.js`; view `visualization-3f36040b9312.js` → `EpithelialNonvascularConnectiveTissueBloodSupplyVisualization`.

#### Nonvascular versus vascular plants

Distinguish nonvascular mosses from vascular ferns by comparing localized surface absorption with connected conducting tissue.

Type `PLANT_NONVASCULAR_VERSUS_VASCULAR_TISSUE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8df93f6c376d.js`; view `visualization-9339714af0cd.js` → `PlantNonvascularVersusVascularTissueVisualization`.

#### Normal cell contact stops growth while contact-insensitive cells keep piling up

Type `DENSITY_DEPENDENT_CONTACT_INHIBITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-84e53f4d916e.js`; view `visualization-b430208ff9f1.js` → `Visualization`.

#### Nucleic acids

DNA has two complementary strands with A-T and G-C base pairs, while RNA is usually one strand and uses U instead of T.

Type `NUCLEIC_ACIDS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-559d658f1bc7.js`; view `visualization-9cb12c700d1a.js` → `Visualization`.

#### Nucleic-acid polymerization

A new nucleotide joins the free 3-prime end of an existing strand, extending the strand in the 5-prime-to-3-prime direction and creating a new 3-prime end.

Type `NUCLEIC_ACID_POLYMERIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-15d314d9a413.js`; view `visualization-c6f2b1dc845a.js` → `Visualization`.

#### Nucleotide structure

One nucleotide contains a phosphate group attached to a five-carbon sugar and a nitrogenous base, with distinct 5-prime and 3-prime landmarks.

Type `NUCLEOTIDE_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-47efaf198b89.js`; view `visualization-fc9a4bc39fc0.js` → `Visualization`.

#### Nucleus and ribosome functions

Type `NUCLEUS_AND_RIBOSOME_FUNCTIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ee04370f5b4d.js`; view `visualization-1fca2ac86b94.js` → `Visualization`.

#### Nutrient runoff and eutrophication

Why can excess nitrogen or phosphorus runoff eventually reduce dissolved oxygen in a lake? Explain the causal sequence from excess nitrogen or phosphorus runoff to algal bloom, decomposer respiration, and lower dissolved oxygen.

Type `BIOGEOCHEMICAL_NUTRIENT_RUNOFF_AND_EUTROPHICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fd6b1f69df6b.js`; view `visualization-4a593f85174c.js` → `Visualization`.

#### Objective power and field of view

Type `MICROSCOPY_OBJECTIVE_POWER_FIELD_OF_VIEW` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-d76cf63ba314.js`; view `visualization-6bd028c86e9b.js` → `Visualization`.

#### Ocean-atmosphere carbon exchange

Can carbon dioxide move both into the ocean and back into the atmosphere? Explain that atmospheric and surface-ocean carbon exchange is bidirectional rather than a one-way permanent removal.

Type `BIOGEOCHEMICAL_CARBON_OCEAN_ATMOSPHERE_EXCHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5aeed8fabbff.js`; view `visualization-b0a8c7f14dcf.js` → `Visualization`.

#### Okazaki-fragment maturation and joining

Type `DNA_REPLICATION_OKAZAKI_FRAGMENT_JOINING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fd02dcfeacd9.js`; view `visualization-aa626062e50a.js` → `DnaReplicationOkazakiFragmentJoiningVisualization`.

#### Oldest fossil and an unsampled ghost lineage

Type `OLDEST_FOSSIL_AND_UNSAMPLED_GHOST_LINEAGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-216aa557c026.js`; view `visualization-d75e072ed5c0.js` → `OldestFossilAndUnsampledGhostLineageVisualization`.

#### One affected X allele passes from a grandfather through his carrier daughter to an affected grandson without father-to-son transmission

Type `MENDELIAN_X_LINKED_PEDIGREE_GRANDFATHER_TO_GRANDSON_TRANSMISSION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-385e9e52f941.js`; view `visualization-fa809f94b702.js` → `Visualization`.

#### One aligned four-chromatid meiotic tetrad preserves maternal and paternal loci

Type `HOMOLOGOUS_CHROMOSOME_PAIRING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7b8c4c4307c7.js`; view `visualization-7fecd0bdec18.js` → `Visualization`.

#### One bacterial cell compared with many cooperating animal cells

One bacterial cell functions as a complete unicellular organism, while four distinct animal cells cooperate as a tissue in a multicellular organism.

Type `CELL_THEORY_UNICELLULAR_AND_MULTICELLULAR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-138f34a0c4e3.js`; view `visualization-6cbe7e6b11ba.js` → `Visualization`.

#### One bacterium biases run-and-tumble movement toward an attractant

Type `BACTERIAL_CHEMOTAXIS_RUN_AND_TUMBLE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d1b77d25749f.js`; view `visualization-b7c854db9396.js` → `BacterialChemotaxisRunAndTumbleVisualization`.

#### One biological outlier shifts the mean but not the median

Type `BIOLOGICAL_OUTLIER_EFFECTS_ON_MEAN_AND_MEDIAN` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-17e25ff46a6a.js`; view `visualization-f0115fa16c94.js` → `BiologicalOutlierEffectsOnMeanAndMedianVisualization`.

#### One cell secretes and receives its own extracellular signal

One cell secretes a signaling molecule into extracellular fluid, receives it at its own matching receptor, and responds to its own signal.

Type `AUTOCRINE_CELL_SIGNALING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ef11fd8d8bd3.js`; view `visualization-4b9fc091f169.js` → `AutocrineCellSignalingVisualization`.

#### One chromosome before and after sister-chromatid duplication

Type `CHROMOSOME_SISTER_CHROMATID_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6b03cb5fae86.js`; view `visualization-2144e3b6e2aa.js` → `Visualization`.

#### One diploid germ cell divides into four genetically distinguishable haploid gametes

Type `MEIOSIS_AND_GENETIC_DIVERSITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-903f216ef2d9.js`; view `visualization-7a5d0bab43be.js` → `Visualization`.

#### One DNA sequence substitution changes the corresponding RNA message

Type `DNA_SEQUENCE_CHANGE_RNA_MESSAGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c4fe17689039.js`; view `visualization-1cc0d1c40198.js` → `DnaSequenceChangeRnaMessageVisualization`.

#### One enclosed secretory protein travels from rough ER through Golgi to outside

Type `ENDOMEMBRANE_TRAFFICKING` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-4d983c1481e8.js`; view `visualization-f9adba69a370.js` → `Visualization`.

#### One endocrine hormone travels through blood to a distant target

One endocrine hormone leaves its source, travels through a continuous blood vessel, and activates a matching receptor on a distant target cell.

Type `ENDOCRINE_LONG_DISTANCE_SIGNALING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f6c683cdbc60.js`; view `visualization-c66a67b102c7.js` → `EndocrineLongDistanceSignalingVisualization`.

#### One existing animal cell divides into two daughter cells

One pre-existing animal cell constricts and divides into exactly two daughter cells, showing that new cells arise from existing cells.

Type `CELL_THEORY_CELLS_FROM_EXISTING_CELLS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e98c48550afd.js`; view `visualization-9bf8ec0c5e34.js` → `Visualization`.

#### One extracellular ligand drives ordered reception, transduction, and response

Reception-to-response animation: one extracellular ligand binds its receptor, intracellular relay proteins activate in order, and the downstream cellular response switches on.

Type `RECEPTION_TRANSDUCTION_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d1c80e1d0db4.js`; view `visualization-38b9ade7072b.js` → `Visualization`.

#### One genotype responds phenotypically after environmental water increases

One plant keeps the same inherited genotype as its environmental water supply increases and its observable height subsequently grows.

Type `PHENOTYPIC_PLASTICITY_ENVIRONMENTAL_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2be4dee1b436.js`; view `visualization-eee15f1aad77.js` → `Visualization`.

#### One lipid-soluble hormone crosses the membrane and binds inside the cell

One lipid-soluble hormone crosses the plasma membrane, binds a receptor inside the cell, and travels with that receptor toward the nucleus.

Type `INTRACELLULAR_RECEPTOR_HORMONE_BINDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-be1fb62525a4.js`; view `visualization-ac243a0f5d1b.js` → `IntracellularReceptorHormoneBindingVisualization`.

#### One morphogen concentration gradient specifies three genome-matched cell fates

Morphogen concentration and cell fate: one localized signal decreases across three stationary cells, so high, medium, and low exposures specify neuronal, muscular, and secretory identities even though each cell retains the same genome.

Type `MORPHOGEN_CONCENTRATION_AND_CELL_FATE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-91baef91fb80.js`; view `visualization-5e76876cfacf.js` → `Visualization`.

#### One neurotransmitter crosses a short extracellular synaptic cleft

A neuron releases one neurotransmitter across a narrow synaptic cleft to the matching receptor of a postsynaptic target cell.

Type `SYNAPTIC_CELL_SIGNALING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-66f5a1e9f035.js`; view `visualization-65d77c3d061e.js` → `SynapticCellSignalingVisualization`.

#### One Pp homologous allele pair segregates into separate haploid gametes

Type `MENDELIAN_ALLELE_SEGREGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8996a01b4d7e.js`; view `visualization-d9d137783a8d.js` → `Visualization`.

#### One pre-mRNA containing three identifiable exons is alternatively spliced into two mature RNA exon combinations that encode different protein isoforms.

Type `ALTERNATIVE_RNA_SPLICING_PROTEIN_ISOFORMS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9bb3ea7504d6.js`; view `visualization-725d356e55f5.js` → `Visualization`.

#### One receptor input becomes two, four, and eight countable activated downstream targets

Signal-amplification animation: one extracellular signal activates one receptor, then two, four, and finally eight individually countable downstream targets without creating any additional ligand.

Type `SIGNAL_AMPLIFICATION_CASCADE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-968519e2786a.js`; view `visualization-fe27de8f6139.js` → `Visualization`.

#### One reciprocal prophase-I crossover changes only two non-sister chromatids

Type `MEIOTIC_CROSSING_OVER_RECOMBINATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e252b29c9c09.js`; view `visualization-764e643e1c82.js` → `Visualization`.

#### One typical XY germ cell separates X and Y in meiosis I and produces two X-bearing and two Y-bearing gametes after meiosis II

Type `MEIOTIC_SEX_CHROMOSOME_SEGREGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-36434ad5d741.js`; view `visualization-abbc6199ffb8.js` → `Visualization`.

#### One-base deletion frameshift

Type `MUTATION_DELETION_FRAMESHIFT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dae82b908220.js`; view `visualization-486d70791679.js` → `Visualization`.

#### One-base insertion frameshift

Type `MUTATION_INSERTION_FRAMESHIFT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cc1dd2f67540.js`; view `visualization-062e3831a191.js` → `Visualization`.

#### Only the receptor-bearing cell responds to a shared extracellular signal

One signal passes a receptor-free bystander and binds a matching receptor on another cell; only the receptor-bearing target responds.

Type `TARGET_CELL_RECEPTOR_SPECIFICITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-89cfdf3518e2.js`; view `visualization-f93005107d59.js` → `TargetCellReceptorSpecificityVisualization`.

#### Open insect circulation versus closed fish circulation

Recognizable insect and fish circulation comparison: insect hemolymph leaves the dorsal vessel and directly bathes body tissues, while fish blood remains enclosed inside one connected closed blood-vessel circuit.

Type `ANIMAL_OPEN_VERSUS_CLOSED_CIRCULATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-14474e6a1a00.js`; view `visualization-b27a0080c86d.js` → `AnimalOpenVersusClosedCirculationVisualization`.

#### Ordered AUG GCU ACC UAA mRNA codons produce Met Ala Thr and stop

Type `MRNA_CODON_AMINO_ACID_SEQUENCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ede2bb873d62.js`; view `visualization-246b11fb37ca.js` → `MrnaCodonAminoAcidSequenceVisualization`.

#### Ordered chromosome alignment, attachment, separation, and nuclear reformation

Type `MITOSIS_CHROMOSOME_SEGREGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dace53f04818.js`; view `visualization-2ce374da9aed.js` → `Visualization`.

#### Organic-carbon burial and long-term geological storage

How does a small fraction of organic carbon enter long-term geological storage? Compare ordinary decomposer-mediated atmospheric return with slow burial of some conserved organic carbon into geological storage.

Type `BIOGEOCHEMICAL_CARBON_BURIAL_AND_GEOLOGICAL_STORAGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-71205a4ffa8c.js`; view `visualization-7a247256cbb3.js` → `Visualization`.

#### Origin of life

Type `ORIGIN_OF_LIFE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d95bac035d6b.js`; view `visualization-99ed174529b5.js` → `Visualization`.

#### Osmoregulator versus osmoconformer

Type `OSMOREGULATOR_VERSUS_OSMOCONFORMER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dc5c5dc65787.js`; view `visualization-ed32686ca2f6.js` → `OsmoregulatorVersusOsmoconformerVisualization`.

#### Osmosis across a selectively permeable membrane

Type `OSMOSIS_ACROSS_SELECTIVELY_PERMEABLE_MEMBRANE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9865b84bddc0.js`; view `visualization-db399aa6cbde.js` → `Visualization`.

#### Outgroup and rooted ingroup

Type `PHYLOGENETIC_OUTGROUP_ROOTING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f43d45b6ce67.js`; view `visualization-488e9447a56b.js` → `Visualization`.

#### Oviparous versus viviparous development

Oviparous versus viviparous development: Oviparous animals lay eggs that complete development outside the parent's body, while viviparous animals retain the developing offspring internally and later give birth to live young.

Type `ANIMAL_OVIPAROUS_VERSUS_VIVIPAROUS_DEVELOPMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-281c7b0fdce4.js`; view `visualization-1bf97fc5407f.js` → `AnimalOviparousVersusViviparousDevelopmentVisualization`.

#### Ovulation, fertilization, and implantation

Ovulation, fertilization, and implantation: An ovary releases an oocyte, fertilization usually occurs after it enters a uterine tube, and the developing embryo subsequently travels to and implants in the uterine lining.

Type `ANIMAL_OVULATION_FERTILIZATION_IMPLANTATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7fc66abbad67.js`; view `visualization-1dc7475cbc79.js` → `AnimalOvulationFertilizationImplantationVisualization`.

#### Paramecium cell structure

Type `PARAMECIUM_CELL_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1ca05a6f8caf.js`; view `visualization-2e498748b9ba.js` → `Visualization`.

#### Paramecium ciliary feeding

Type `PARAMECIUM_CILIARY_FEEDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2812b151314b.js`; view `visualization-4aa793d6bea5.js` → `Visualization`.

#### Paramecium conjugation genetic exchange

Type `PARAMECIUM_CONJUGATION_GENETIC_EXCHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-10c6b91f46d9.js`; view `visualization-ef9dc7ffea52.js` → `Visualization`.

#### Parasitism host exploitation

Type `PARASITISM_HOST_EXPLOITATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e2995816cc04.js`; view `visualization-638118ecf5ce.js` → `ParasitismHostExploitationVisualization`.

#### Passive versus active membrane transport

Type `PASSIVE_VERSUS_ACTIVE_MEMBRANE_TRANSPORT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-60c0f2051182.js`; view `visualization-a074887f5f9c.js` → `Visualization`.

#### Pasteur swan-neck control compared with airborne contamination

Two matched air-exposed flasks contain sterile broth. The intact swan neck traps airborne microbes and stays clear, while the broken neck admits a microbe and its broth turns cloudy.

Type `CELL_THEORY_PASTEUR_SWAN_NECK_EXPERIMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-176ec8799755.js`; view `visualization-1d54011d0021.js` → `Visualization`.

#### Pathogen types

How do bacteria, viruses, fungi, and protists differ? Distinguish the cellular bacterium, acellular virus, budding fungus, and nucleated protist as four structurally different categories that may contain pathogens.

Type `PATHOGEN_TYPES_BACTERIA_VIRUSES_FUNGI_PROTISTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fa708737a87c.js`; view `visualization-d6880449a97e.js` → `PathogenTypesBacteriaVirusesFungiProtistsVisualization`.

#### PCR exponential DNA amplification

A branching molecular PCR diagram starts with one DNA duplex and successively shows two, four, and eight traceable double-stranded target copies beside a recognizable thermal cycler.

Type `PCR_EXPONENTIAL_DNA_AMPLIFICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c5e965dedd58.js`; view `visualization-f8c0eaf4aa1b.js` → `Visualization`.

#### PCR primer-directed extension

Two separated DNA template strands receive inward-facing primers; two recognizable DNA polymerases extend opposite complementary product strands 5′ to 3′ across the same bounded target.

Type `PCR_PRIMER_DIRECTED_EXTENSION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-9286f48637e3.js`; view `visualization-ce2bfe9f3c09.js` → `Visualization`.

#### PCR temperature cycle

Three adjacent molecular DNA states compare separated template strands at 95 °C, complementary primers bound near 55 °C, and newly synthesized complementary strands near 72 °C beside a recognizable thermal cycler.

Type `PCR_TEMPERATURE_CYCLE_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b1f5bdff361b.js`; view `visualization-a3ebc60f664f.js` → `Visualization`.

#### Pepsin and trypsin have different pH activity optima

Type `ENZYME_PH_ACTIVITY_PROFILES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-514aee4664b9.js`; view `visualization-2d2167308592.js` → `Visualization`.

#### Peptide-bond formation

Type `PEPTIDE_BOND_FORMATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-74770209df91.js`; view `visualization-f69473be4acc.js` → `PeptideBondFormationVisualization`.

#### Peroxisome catalase compartmentalizes hydrogen peroxide detoxification

Type `PEROXISOME_DETOXIFICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c73b720d8ff4.js`; view `visualization-81b17f66efef.js` → `Visualization`.

#### pH and enzyme active-site charge

Type `BIOLOGICAL_PH_ENZYME_ACTIVE_SITE_CHARGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a9265b5284a6.js`; view `visualization-12edf42443bd.js` → `Visualization`.

#### Phagocytosis and phagolysosome digestion

How does a phagocyte engulf and digest a captured bacterium? Explain how receptor-mediated engulfment encloses a pathogen in a phagosome and lysosome fusion creates a degradative phagolysosome.

Type `IMMUNE_PHAGOCYTOSIS_PHAGOLYSOSOME_DIGESTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-47fb4096cea6.js`; view `visualization-3807ff1f7988.js` → `ImmunePhagocytosisPhagolysosomeDigestionVisualization`.

#### Phanerozoic Paleozoic, Mesozoic, and Cenozoic eras

Type `PHANEROZOIC_PALEOZOIC_MESOZOIC_CENOZOIC_ERAS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-582c2660c9dc.js`; view `visualization-ef97a6dc385a.js` → `PhanerozoicPaleozoicMesozoicCenozoicErasVisualization`.

#### Phloem source-to-sink sugar transport

Sugars moving from a mature source leaf through phloem toward both an upper growing shoot and a lower storage root

Type `PLANT_PHLOEM_SOURCE_TO_SINK_TRANSPORT` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-9a2cd7c5afe7.js`; view `visualization-d5e2970c1a43.js` → `Visualization`.

#### Phosphate functional-group structure and negative charge

Type `BIOLOGICAL_PHOSPHATE_FUNCTIONAL_GROUP_CHARGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e70e31610f3c.js`; view `visualization-73c87f6f4367.js` → `Visualization`.

#### Phospholipid bilayer self-assembly

Type `PHOSPHOLIPID_BILAYER_SELF_ASSEMBLY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dd0c1b24d29b.js`; view `visualization-279ee0659997.js` → `PhospholipidBilayerSelfAssemblyVisualization`.

#### Phospholipid structure and polarity

Type `PHOSPHOLIPID_STRUCTURE_POLARITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f39f27209112.js`; view `visualization-77431a1fe84f.js` → `PhospholipidStructurePolarityVisualization`.

#### Phosphorus from rock to the food web

How does phosphate leave rock, enter living organisms, and return to the soil? Explain how weathering releases phosphate into soil, producers assimilate it, consumers obtain it through feeding, and decomposition returns phosphate for reuse.

Type `BIOGEOCHEMICAL_PHOSPHORUS_ROCK_TO_FOOD_WEB` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4b9d5cc2789d.js`; view `visualization-907667434e5b.js` → `Visualization`.

#### Phosphorus has no major atmospheric reservoir

Why does the phosphorus cycle differ from the carbon and nitrogen cycles? Distinguish phosphorus's mainly geological, aquatic, and biological reservoirs from the major atmospheric gas reservoirs of carbon and nitrogen.

Type `BIOGEOCHEMICAL_PHOSPHORUS_NO_ATMOSPHERIC_RESERVOIR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-22a22f45a358.js`; view `visualization-df8a8ee1e252.js` → `Visualization`.

#### Phosphorus sedimentation and uplift

How does phosphorus return from aquatic sediment to land over geological time? Explain why sediment burial, rock formation, and geological uplift close the phosphorus cycle much more slowly than biological recycling.

Type `BIOGEOCHEMICAL_PHOSPHORUS_SEDIMENTATION_AND_UPLIFT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b55fe341963b.js`; view `visualization-b05ec9f7170c.js` → `Visualization`.

#### Photosynthesis and respiration carbon exchange

How does one carbon atom move from atmospheric carbon dioxide into a food web and back into the air? Trace the same carbon from atmospheric carbon dioxide into producer and consumer biomass and back to the atmosphere through respiration.

Type `BIOGEOCHEMICAL_CARBON_PHOTOSYNTHESIS_RESPIRATION_EXCHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-601faaaa2b3f.js`; view `visualization-bb6764b16422.js` → `Visualization`.

#### Photosynthesis Calvin-cycle carbon accounting

Type `PHOTOSYNTHESIS_CALVIN_CYCLE_CARBON_ACCOUNTING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4b69eb2051a2.js`; view `visualization-99d98b25ffd1.js` → `Visualization`.

#### Photosynthesis chemiosmosis and ATP production

Type `PHOTOSYNTHESIS_CHEMIOSMOSIS_ATP_PRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d944714824d1.js`; view `visualization-1c3ab8562866.js` → `Visualization`.

#### Photosynthesis chloroplast organization

Type `PHOTOSYNTHESIS_CHLOROPLAST_ORGANIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5813e9552d88.js`; view `visualization-815bccedb539.js` → `Visualization`.

#### Photosynthesis light and carbon-dioxide limitation

Type `PHOTOSYNTHESIS_LIGHT_CARBON_DIOXIDE_LIMITATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7439b956bf95.js`; view `visualization-3c94ffb4c2d7.js` → `Visualization`.

#### Photosynthesis light reaction and Calvin-cycle coupling

Type `PHOTOSYNTHESIS_LIGHT_CALVIN_STAGE_COUPLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b4093a0b5b43.js`; view `visualization-3c138664a851.js` → `Visualization`.

#### Photosynthesis matter and energy inputs and outputs

Type `PHOTOSYNTHESIS_MATTER_ENERGY_INPUTS_OUTPUTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3ea07158b348.js`; view `visualization-bddeede21c38.js` → `Visualization`.

#### Photosynthesis stomatal water and carbon tradeoff

Type `PHOTOSYNTHESIS_STOMATAL_WATER_CARBON_TRADEOFF` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1e708a76dbab.js`; view `visualization-5d2eaf470cc4.js` → `Visualization`.

#### Photosynthesis thylakoid proton gradient

Type `PHOTOSYNTHESIS_THYLAKOID_PROTON_GRADIENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-38c90aa02cfd.js`; view `visualization-46e7478cb72c.js` → `Visualization`.

#### Photosynthesis water splitting and oxygen release

Type `PHOTOSYNTHESIS_WATER_SPLITTING_OXYGEN_RELEASE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a6a40f3e6ad7.js`; view `visualization-48827445b556.js` → `Visualization`.

#### Photosynthesis: water to NADPH through PSII, ETC, and PSI

Type `PHOTOSYNTHESIS_LIGHT_REACTION_ELECTRON_TRANSPORT` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-3d6c55d30edf.js`; view `visualization-2e3874caa780.js` → `Visualization`.

#### Photosynthetic producers and consuming organisms

Type `LIFE_PHOTOSYNTHETIC_VERSUS_CONSUMING_ORGANISMS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-957f4059bcf0.js`; view `visualization-775004a393d0.js` → `Visualization`.

#### Phototropism auxin redistribution

Type `PHOTOTROPISM_AUXIN_REDISTRIBUTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-730ccc93b238.js`; view `visualization-5f8671a69d9f.js` → `Visualization`.

#### Phylogenetic branch rotation invariance

Type `PHYLOGENETIC_TREE_ROTATION_INVARIANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3450bd7547c0.js`; view `visualization-0460feef96c4.js` → `Visualization`.

#### Phylogeny and common ancestry overview

Type `PHYLOGENY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2b8c3230c712.js`; view `visualization-397147da9e5f.js` → `Visualization`.

#### Phytochrome night interruption

Type `PHYTOCHROME_NIGHT_INTERRUPTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6d2ee197824e.js`; view `visualization-7c954082f5ab.js` → `Visualization`.

#### Placental maternal-fetal exchange

Placental maternal-fetal exchange: Maternal and fetal circulations remain physically separate at the placenta; oxygen and nutrients cross toward fetal blood, while fetal carbon dioxide and other wastes cross in the opposite direction toward maternal blood.

Type `ANIMAL_PLACENTAL_MATERNAL_FETAL_EXCHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1b121da66991.js`; view `visualization-49a73561a7d6.js` → `AnimalPlacentalMaternalFetalExchangeVisualization`.

#### Plant cell structure and function

Type `PLANT_CELL_STRUCTURE_AND_FUNCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3112f6a513b6.js`; view `visualization-a1ea0504071e.js` → `Visualization`.

#### Plant cell wall and animal extracellular-matrix overview

Plant cell supported by an exterior cellulose wall and animal cell attached to an exterior extracellular matrix; both have a plasma membrane.

Type `CELLULAR_ENVIRONMENT_INTERACTIONS_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c20397973282.js`; view `visualization-4f81020ffcb4.js` → `Visualization`.

#### Plant cell wall, membrane, and vacuole

Type `PLANT_CELL_WALL_MEMBRANE_AND_VACUOLE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9ed00bb79a1b.js`; view `visualization-f5207a666d6b.js` → `Visualization`.

#### Plant diversity and life cycles

Compare four major living land-plant groups by their recognizable body forms and their spore-based or seed-based reproduction.

Type `PLANT_DIVERSITY_AND_LIFE_CYCLES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5a4bba801ffe.js`; view `visualization-a910b4726de9.js` → `PlantDiversityAndLifeCyclesVisualization`.

#### Plant evolution: vascular tissue, seeds, and flowers

Place vascular tissue, seeds, and flowers at successive shared-ancestry branch points without portraying living lineages as a linear ladder.

Type `PLANT_EVOLUTION_VASCULAR_TISSUE_SEEDS_AND_FLOWERS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c08e9adeca21.js`; view `visualization-30f44d3b04a7.js` → `PlantEvolutionVascularTissueSeedsAndFlowersVisualization`.

#### Plant photosynthesis inputs are sunlight, carbon dioxide, and water

A whole plant uses sunlight, carbon dioxide, and water to make sugar and release oxygen.

Type `PHOTOSYNTHESIS_INPUTS_SUGAR_OXYGEN_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-31d40876948d.js`; view `visualization-139127ad5523.js` → `Visualization`.

#### Plant respiration continues as daytime photosynthesis gives way to night

A plant takes in carbon dioxide and releases oxygen in daylight, then takes in oxygen and releases carbon dioxide at night while respiration continues throughout.

Type `PLANT_PHOTOSYNTHESIS_AND_RESPIRATION_DAY_NIGHT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c60f2e059d80.js`; view `visualization-20fd9ff389d8.js` → `Visualization`.

#### Plant root and shoot system interdependence

Type `PLANT_ROOT_SHOOT_SYSTEM_INTERDEPENDENCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-34882bf4bb7d.js`; view `visualization-8f902f5e6e8a.js` → `Visualization`.

#### Plant root-water uptake and leaf transpiration

How does soil water move through plants back into the atmosphere? Trace one conserved water marker from soil pore water through plant roots and leaves into the atmospheric reservoir by transpiration.

Type `BIOGEOCHEMICAL_WATER_PLANT_UPTAKE_AND_TRANSPIRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ca8bf97e182d.js`; view `visualization-cb4f6364fbcd.js` → `Visualization`.

#### Plant spores versus seeds

Compare a haploid single-celled spore with a seed containing a multicellular embryo, protective coat, and stored food.

Type `PLANT_SPORES_VERSUS_SEEDS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-11635086c77a.js`; view `visualization-dcbee349cdd5.js` → `PlantSporesVersusSeedsVisualization`.

#### Plant statolith gravity sensing

Type `PLANT_STATOLITH_GRAVITY_SENSING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-87082793c117.js`; view `visualization-334c7a52a66d.js` → `Visualization`.

#### Plant-cell turgidity, flaccidity, and plasmolysis across three tonicities

Type `PLANT_CELL_TONICITY_COMPARISON` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-473636c1b4a2.js`; view `visualization-639e0b77717a.js` → `Visualization`.

#### Plant-made sugar moves into root storage and supports new growth

Sugar made in a plant leaf moves down the stem into root storage and helps the plant grow new tissue.

Type `PLANT_SUGAR_STORAGE_AND_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1bb10f568067.js`; view `visualization-3255252069c6.js` → `Visualization`.

#### Plant, fungal, and animal cell structures

Type `LIFE_PLANT_ANIMAL_FUNGAL_CELL_STRUCTURES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-43d87d417522.js`; view `visualization-5be0ce5e5984.js` → `Visualization`.

#### Plants and animals exchange matter while energy enters and leaves

A whole plant and animal exchange food, oxygen, carbon dioxide, and water while sunlight enters and heat leaves.

Type `MATTER_AND_ENERGY_IN_WHOLE_ORGANISMS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9346786336cc.js`; view `visualization-7038e7b68b4c.js` → `Visualization`.

#### Plasma membrane as a cell boundary

Type `PLASMA_MEMBRANE_CELL_BOUNDARY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f17429136507.js`; view `visualization-11c4927b492d.js` → `Visualization`.

#### Plasma membrane fluid-mosaic architecture

Type `PLASMA_MEMBRANE_FLUID_MOSAIC_ARCHITECTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d88acbd7550a.js`; view `visualization-cd0f27ac54c1.js` → `Visualization`.

#### Plasmid sticky-end ligation

An open circular plasmid and donor DNA each expose complementary sticky ends; both donor ends align, ligase seals two junctions, and the closed recombinant plasmid retains a conspicuous donor insert.

Type `PLASMID_STICKY_END_LIGATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-1d40c81439ff.js`; view `visualization-be90100b6bbd.js` → `Visualization`.

#### Platelet recruitment amplifies until the same vessel wound is sealed

A first platelet adheres to an open blood-vessel wound, recruits additional individually tracked platelets, and forms a plug that seals the opening and stops further recruitment.

Type `POSITIVE_FEEDBACK_BLOOD_CLOTTING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b02b2dfd921a.js`; view `visualization-1f8a9c321a63.js` → `PositiveFeedbackBloodClottingVisualization`.

#### Pollen fertilization without standing water

Follow pollen landing on a recognizable flower, internal pollen-tube sperm transport to a protected haploid egg, and formation of a visible diploid zygote without an external water film.

Type `PLANT_POLLEN_FERTILIZATION_WITHOUT_STANDING_WATER` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-a7661cf22b89.js`; view `visualization-53d80b185b75.js` → `PlantPollenFertilizationWithoutStandingWaterVisualization`.

#### Pollen transfer during pollination

A bee carrying one continuous pollen grain from the anther of one flower to the receptive stigma of another flower

Type `PLANT_POLLINATION_POLLEN_TRANSFER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-66f677011260.js`; view `visualization-9873b29fb639.js` → `Visualization`.

#### Pollen-tube growth and fertilization

Pollen already on a stigma grows a tube through the style, delivers a male gamete into an ovule, and ends with a visibly fertilized ovule inside the ovary

Type `PLANT_POLLEN_TUBE_FERTILIZATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-1ef887f46e6e.js`; view `visualization-2cf4bab83def.js` → `Visualization`.

#### Pollination, fertilization, and seed formation

Flowering-plant reproduction: a bee transfers pollen to a flower, reproductive material reaches an ovule, and fertilization leads to a new seed.

Type `ORGANISM_POLLINATION_FERTILIZATION_AND_SEEDS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-456f40972751.js`; view `visualization-fba43d5dc83b.js` → `OrganismPollinationFertilizationAndSeedsVisualization`.

#### Population adaptation across generations

Type `POPULATION_ADAPTATION_ACROSS_GENERATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e363e27a2e77.js`; view `visualization-c71e4bafb11e.js` → `PopulationAdaptationAcrossGenerationsVisualization`.

#### Population bottleneck and persistent variation loss

Type `POPULATION_GENETICS_BOTTLENECK_EFFECT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d3c203a3615d.js`; view `visualization-8dd0d1612407.js` → `Visualization`.

#### Population ecology and environmental limits

Type `POPULATION_ECOLOGY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-33388a0d2369.js`; view `visualization-648d24d401c6.js` → `Visualization`.

#### Population genetics and evolutionary mechanisms

Type `POPULATION_GENETICS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f47a75a6fa96.js`; view `visualization-41384accc6a5.js` → `Visualization`.

#### Population size and genetic-drift magnitude

Type `POPULATION_GENETICS_POPULATION_SIZE_AND_DRIFT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9c814862b668.js`; view `visualization-5581868f829e.js` → `Visualization`.

#### Posterior pituitary neurohormone release

Type `POSTERIOR_PITUITARY_NEUROHORMONE_RELEASE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2294a8d7b5d0.js`; view `visualization-1635028b898f.js` → `Visualization`.

#### Postsynaptic potential summation

Excitatory and inhibitory inputs converge on one neuron. Inhibition first keeps the net voltage below threshold; additional excitation reaches threshold and triggers an axonal action potential.

Type `POSTSYNAPTIC_POTENTIAL_SUMMATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ec07fcfd2e5c.js`; view `visualization-55c0d8e6f12e.js` → `PostsynapticPotentialSummationVisualization`.

#### PP and Pp are purple while only pp expresses the white recessive phenotype

Type `MENDELIAN_GENOTYPE_PHENOTYPE_DOMINANCE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-d879e1d7aee6.js`; view `visualization-4d4e943a6f13.js` → `Visualization`.

#### PP, Pp, and pp parental genotypes predict distinct one-allele gametes

Type `MENDELIAN_GAMETE_FORMATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-417542ada9fc.js`; view `visualization-f84fd2adbfdc.js` → `Visualization`.

#### Pre-existing genetic variation and environmental disturbance

Type `BIODIVERSITY_GENETIC_VARIATION_ENVIRONMENTAL_CHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e170c982f551.js`; view `visualization-d3db9db3d188.js` → `Visualization`.

#### Pre-mRNA exon and intron structure

Type `PRE_MRNA_EXON_INTRON_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-56a4ca180bc0.js`; view `visualization-786a5fa7c717.js` → `Visualization`.

#### Pre-mRNA intron splicing

Type `PRE_MRNA_INTRON_SPLICING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-431599afd2c5.js`; view `visualization-20afac708871.js` → `Visualization`.

#### Pre-mRNA processing

Type `PRE_MRNA_PROCESSING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-49cdf9fb2e2a.js`; view `visualization-e2c6bbb55bff.js` → `Visualization`.

#### Prebiotic organic-molecule synthesis

Type `PREBIOTIC_ORGANIC_MOLECULE_SYNTHESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ad9c84116c3e.js`; view `visualization-ed158f69ba4c.js` → `Visualization`.

#### Predation energy and population effects

Type `PREDATION_ENERGY_AND_POPULATION_EFFECTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9a0afcf611ce.js`; view `visualization-fe56af8019cf.js` → `PredationEnergyAndPopulationEffectsVisualization`.

#### Predator reintroduction trophic recovery

Type `PREDATOR_REINTRODUCTION_TROPHIC_RECOVERY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-38f3976a9f65.js`; view `visualization-b7bcc462f577.js` → `PredatorReintroductionTrophicRecoveryVisualization`.

#### Predator removal trophic cascade

Type `PREDATOR_REMOVAL_TROPHIC_CASCADE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c87ab31932ad.js`; view `visualization-35e3738b4329.js` → `PredatorRemovalTrophicCascadeVisualization`.

#### Prepare a wet-mount microscope slide

Type `MICROSCOPY_WET_MOUNT_SLIDE_PREPARATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9ee7adca7cb4.js`; view `visualization-7ab3e0a5a00f.js` → `Visualization`.

#### Primary amino-acid sequence determines protein fold

Type `PROTEIN_PRIMARY_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-db2739ae4e9e.js`; view `visualization-bd3854ad9707.js` → `ProteinPrimaryStructureVisualization`.

#### Primary and secondary immune response

Why is a second response to the same antigen faster and larger? Interpret the standard antibody-versus-time curves to explain why antigen-specific immune memory yields a faster and greater response upon re-exposure to the same antigen.

Type `IMMUNE_MEMORY_SECONDARY_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-525fa85740da.js`; view `visualization-274262de5060.js` → `ImmuneMemorySecondaryResponseVisualization`.

#### Primary sensory cilium compared with multiple motile cilia

Distinguish a typical nonmotile 9+0 primary sensory cilium from 9+2 motile cilia by their axonemal structure, dynein arms, abundance, and cellular function.

Type `PRIMARY_VERSUS_MOTILE_CILIA` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-22e1b8e54a6d.js`; view `visualization-f00c2b1539cc.js` → `Visualization`.

#### Primary succession community assembly

Type `PRIMARY_SUCCESSION_COMMUNITY_ASSEMBLY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b1c99b0e9519.js`; view `visualization-5de9f64cd031.js` → `PrimarySuccessionCommunityAssemblyVisualization`.

#### Producer to consumer energy transfer

Type `PRODUCER_TO_CONSUMER_ENERGY_TRANSFER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bc6a88a45b34.js`; view `visualization-bbc7954bf4ec.js` → `Visualization`.

#### Programmed interdigital cell death separates a recognizable developing hand

Developmental apoptosis and digit separation: one recognizable developing hand begins with webbed fingers, selected cells between its digits undergo orderly programmed removal, and the same separated fingers and connected living palm remain.

Type `DEVELOPMENTAL_APOPTOSIS_AND_DIGIT_SEPARATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5708de5d2d55.js`; view `visualization-386b110c16fe.js` → `Visualization`.

#### Prokaryotic cell organization

Type `PROKARYOTIC_CELL_ORGANIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-87edb06effd5.js`; view `visualization-b36673800298.js` → `Visualization`.

#### Promoter and RNA polymerase initiation

Type `PROMOTER_RNA_POLYMERASE_INITIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7240b8a55edc.js`; view `visualization-47a4b3eb6e29.js` → `Visualization`.

#### Promoter-associated DNA methylation accumulates on an unchanged DNA sequence, reduces transcriptional access, and silences mRNA production.

Type `DNA_METHYLATION_TRANSCRIPTIONAL_SILENCING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-681a2655f19a.js`; view `visualization-1a27211a2992.js` → `Visualization`.

#### Prophase, metaphase, anaphase, and telophase comparison

Type `MITOSIS_PHASE_SEQUENCE_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bcf4f215a71f.js`; view `visualization-c8612206a06e.js` → `Visualization`.

#### Proteins: four levels of structure and functional shape

Type `PROTEINS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-256a9cb0a0be.js`; view `visualization-9cc0dc653d22.js` → `ProteinsVisualization`.

#### Protist binary fission

Type `PROTIST_BINARY_FISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3c3b810eebf1.js`; view `visualization-b0287847eeba.js` → `Visualization`.

#### Protist diversity and nutrition

Type `PROTIST_DIVERSITY_AND_NUTRITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bd028d9729f9.js`; view `visualization-d9ab4c7c44f9.js` → `Visualization`.

#### Protist locomotion mechanisms

Type `PROTIST_LOCOMOTION_MECHANISMS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6748a0cc812e.js`; view `visualization-8828df2ded31.js` → `Visualization`.

#### Protocell membrane self-assembly

Type `PROTOCELL_MEMBRANE_SELF_ASSEMBLY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-65e5956bead2.js`; view `visualization-7b5a1ddc2600.js` → `Visualization`.

#### Protostome versus deuterostome development

Type `ANIMAL_PROTOSTOME_VERSUS_DEUTEROSTOME_DEVELOPMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-36f42c0631b0.js`; view `visualization-1698c220f7e6.js` → `AnimalProtostomeVersusDeuterostomeDevelopmentVisualization`.

#### Pyruvate oxidation carbon transfer

Type `PYRUVATE_OXIDATION_CARBON_TRANSFER` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-22451dfcee89.js`; view `visualization-29efd856b261.js` → `PyruvateOxidationCarbonTransferVisualization`.

#### Quaternary protein subunit assembly

Type `PROTEIN_QUATERNARY_ASSEMBLY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c3c73ddc9a67.js`; view `visualization-96df074437a1.js` → `ProteinQuaternaryAssemblyVisualization`.

#### Radial versus bilateral animal symmetry

Type `ANIMAL_RADIAL_VERSUS_BILATERAL_SYMMETRY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b96e0196f8fc.js`; view `visualization-e357d327c000.js` → `AnimalRadialVersusBilateralSymmetryVisualization`.

#### Random biological sampling and selection bias

Type `BIOLOGICAL_RANDOM_SAMPLING_AND_SELECTION_BIAS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3ffcf202f4bc.js`; view `visualization-380a78a61b84.js` → `BiologicalRandomSamplingAndSelectionBiasVisualization`.

#### Random genetic drift through chance sampling

Type `POPULATION_GENETICS_RANDOM_GENETIC_DRIFT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-da43ebb83605.js`; view `visualization-1e8856475558.js` → `Visualization`.

#### Reception, intracellular transduction, and response in one target cell

Signal-transduction architecture: an extracellular ligand binds a membrane receptor during reception, intracellular relay proteins carry the signal during transduction, and an activated target produces the cellular response.

Type `SIGNAL_TRANSDUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7d3e23e63010.js`; view `visualization-5285309158ed.js` → `Visualization`.

#### Reciprocal crossover preserves parental and recombinant chromatid products

Type `LINKED_GENE_RECOMBINATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e21ff116a578.js`; view `visualization-f65d70b35ad5.js` → `LinkedGeneRecombinationVisualization`.

#### Recognizable blood, nerve, and muscle cells perform complementary jobs

Type `SPECIALIZED_CELLS_AND_DIVISION_OF_LABOR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-23270fc37604.js`; view `visualization-3893c3bbafda.js` → `Visualization`.

#### Recognizable DNA and RNA polymerases make two DNA duplexes or one RNA strand from the same DNA

Type `DNA_REPLICATION_VERSUS_TRANSCRIPTION_PRODUCTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ec4662dd36a9.js`; view `visualization-c9e0709c581d.js` → `DnaReplicationVersusTranscriptionProductsVisualization`.

#### Recognizable fish single circulation versus mammalian double circulation

Recognizable fish and mammal circulation comparison: the fish's exposed gills and heart form a single heart-to-gills-to-body circuit with one heart passage, while the mammal's lungs and divided heart form connected pulmonary and systemic circuits with two heart passages.

Type `ANIMAL_SINGLE_VERSUS_DOUBLE_CIRCULATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-5166bb8452fd.js`; view `visualization-1b2728f6b49c.js` → `AnimalSingleVersusDoubleCirculationVisualization`.

#### Recognizable pea pollen and ovule fuse into a Pp zygote before a subordinate purple-flower phenotype appears

Type `MENDELIAN_RANDOM_FERTILIZATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-b9a71ab31d05.js`; view `visualization-f66785dae2ba.js` → `Visualization`.

#### Recombinant DNA plasmid workflow

One conspicuous donor gene joins an initially empty circular plasmid; the same thick donor arc stays visible on the recombinant ring and on that same recombinant plasmid inside a recognizable bacterial host.

Type `RECOMBINANT_DNA_PLASMID_WORKFLOW` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-eb58d40a2be5.js`; view `visualization-4a7630177422.js` → `Visualization`.

#### Reductional meiosis I separates homologs while equational meiosis II separates sisters

Type `MEIOSIS_ONE_VERSUS_MEIOSIS_TWO` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-eab69d4e0986.js`; view `visualization-fa2d9626a184.js` → `Visualization`.

#### Reflex-arc neural-circuit wiring

A hand supplies afferent sensory input to the spinal cord, a central interneuron relays the signal, and an efferent motor neuron activates a skeletal-muscle effector.

Type `REFLEX_ARC_NEURAL_CIRCUIT_WIRING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-884bf18a6de5.js`; view `visualization-1789e4a3d4bd.js` → `ReflexArcNeuralCircuitWiringVisualization`.

#### Relative versus radiometric fossil dating

Type `RELATIVE_VERSUS_RADIOMETRIC_FOSSIL_DATING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5dac37ab176d.js`; view `visualization-c1f52074d082.js` → `RelativeVersusRadiometricFossilDatingVisualization`.

#### Repairable DNA damage permits survival while irreparable damage triggers apoptosis

Type `DNA_DAMAGE_REPAIR_VERSUS_APOPTOSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2d9552d87b54.js`; view `visualization-8a909cf795be.js` → `Visualization`.

#### Replication-fork architecture

Type `DNA_REPLICATION_FORK_ARCHITECTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-84a825f34b15.js`; view `visualization-7ee6e78f4ded.js` → `DnaReplicationForkArchitectureVisualization`.

#### Representative bacterial, animal, and plant cells on a logarithmic scale

Representative bacterial, animal, and plant cells align with equally spaced logarithmic scale marks at 1, 10, and 100 micrometers; each step represents a tenfold increase.

Type `CELL_THEORY_CELL_SIZE_SCALE_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4918d12b14e8.js`; view `visualization-2d82b1e0a4f8.js` → `Visualization`.

#### Resource partitioning habitat zones

Type `RESOURCE_PARTITIONING_HABITAT_ZONES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-719c392ffb20.js`; view `visualization-b893a4247e3f.js` → `ResourcePartitioningHabitatZonesVisualization`.

#### Restriction digest gel band patterns

One linear DNA molecule contains two marked restriction sites; its uncut lane retains one high band, while a digested lane contains three size-ordered bands beside a DNA ladder.

Type `RESTRICTION_DIGEST_GEL_BAND_PATTERNS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-40644034cec7.js`; view `visualization-5f295243cc1d.js` → `Visualization`.

#### Restriction enzyme recognition sites

Two double-stranded DNA sequences compare the canonical EcoRI recognition palindrome GAATTC/CTTAAG with a one-base nonmatching sequence; offset cut marks identify the matching site's staggered cleavage positions.

Type `RESTRICTION_ENZYME_RECOGNITION_SITES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-65a92b70efc5.js`; view `visualization-6f306929a57b.js` → `Visualization`.

#### Restriction enzyme sticky-end cleavage

One intact DNA duplex recruits a recognizable restriction endonuclease to its marked recognition sequence, acquires staggered cuts, and separates into two products with conspicuous complementary sticky ends.

Type `RESTRICTION_ENZYME_STICKY_END_CLEAVAGE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-8d101a5ae687.js`; view `visualization-9a114486b9c8.js` → `Visualization`.

#### Retinal phototransduction and hyperpolarization

Type `SENSORY_RETINAL_PHOTOTRANSDUCTION_HYPERPOLARIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-32d2e210b282.js`; view `visualization-c1fd035cb7aa.js` → `Visualization`.

#### Reversible macromolecule dehydration synthesis and hydrolysis

Type `MACROMOLECULE_DEHYDRATION_HYDROLYSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3944760eb043.js`; view `visualization-bbd0bb280056.js` → `Visualization`.

#### Ribosome E exit, P peptidyl, and A aminoacyl sites

Type `RIBOSOME_A_P_E_SITES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4afe8158dd2f.js`; view `visualization-415f113a4cc0.js` → `RibosomeAPESitesVisualization`.

#### RNA polymerase reads a DNA template and extends RNA five to three prime

Type `RNA_POLYMERASE_TEMPLATE_DIRECTED_SYNTHESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9a2714f81251.js`; view `visualization-65d6514ab588.js` → `RnaPolymeraseTemplateDirectedSynthesisVisualization`.

#### RNA polymerase template-strand reading

Type `RNA_POLYMERASE_TEMPLATE_STRAND_READING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cf97b8333197.js`; view `visualization-5a11f7ccf3b5.js` → `Visualization`.

#### RNA primer initiates DNA synthesis

Type `DNA_REPLICATION_RNA_PRIMER_INITIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ba1da8d050b8.js`; view `visualization-37456c0b4a96.js` → `DnaReplicationRnaPrimerInitiationVisualization`.

#### RNA template-directed replication

Type `RNA_TEMPLATE_DIRECTED_REPLICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-218e81c32abc.js`; view `visualization-dd4c8ee7b580.js` → `Visualization`.

#### RNA-world information and catalysis

Type `RNA_WORLD_INFORMATION_AND_CATALYSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-49cb1621f5ba.js`; view `visualization-8d31a425d6ed.js` → `Visualization`.

#### Rod and cone visual sensitivity

Type `SENSORY_VISUAL_RODS_CONES_LIGHT_SENSITIVITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6afae062f026.js`; view `visualization-349780dc4bc5.js` → `Visualization`.

#### Root cross-section tissue systems

Flowering-plant root cross section showing root hairs and epidermis around the cortex, an endodermis surrounding central xylem, and phloem between the xylem arms

Type `PLANT_ROOT_CROSS_SECTION_TISSUE_SYSTEMS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1b82a77caf7f.js`; view `visualization-9defaae0728a.js` → `Visualization`.

#### Root gravitropism auxin reorientation

Type `ROOT_GRAVITROPISM_AUXIN_REORIENTATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-feeae5b7bea7.js`; view `visualization-24be35f2d0ad.js` → `Visualization`.

#### Root hydrotropism and moisture gradients

Type `ROOT_HYDROTROPISM_MOISTURE_GRADIENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ae71bdeade15.js`; view `visualization-fe432c3530a1.js` → `Visualization`.

#### Root-hair mineral-ion uptake

Magnified root hair using an ATP-powered membrane pump to move a dissolved mineral ion from lower concentration in soil into higher concentration inside the root cell

Type `PLANT_ROOT_HAIR_MINERAL_ION_UPTAKE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cda463d5cfd9.js`; view `visualization-7edd3f8b12aa.js` → `Visualization`.

#### Root-hair water absorption

Magnified root hair absorbing water from soil and carrying that same water through root tissue into xylem

Type `PLANT_ROOT_HAIR_WATER_ABSORPTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-118f50b240ca.js`; view `visualization-bf2cab356b7e.js` → `Visualization`.

#### Rooted phylogenetic tree anatomy

Type `ROOTED_PHYLOGENETIC_TREE_ANATOMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b5cb286d2ce2.js`; view `visualization-42a353414441.js` → `Visualization`.

#### Rough versus smooth endoplasmic reticulum

Type `ROUGH_VERSUS_SMOOTH_ENDOPLASMIC_RETICULUM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-12cccf874cb5.js`; view `visualization-e671e735f044.js` → `Visualization`.

#### Saturating biological dose-response relationship

Type `BIOLOGICAL_DOSE_RESPONSE_AND_SATURATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a29ff7456296.js`; view `visualization-5ae0e4de60e5.js` → `BiologicalDoseResponseAndSaturationVisualization`.

#### Seasonal food scarcity induces hibernation and reduced metabolism

Type `HIBERNATION_SEASONAL_ENERGY_CONSERVATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f30ca30c2a6d.js`; view `visualization-3344d4a37dab.js` → `HibernationSeasonalEnergyConservationVisualization`.

#### Secondary active cotransport

Type `SECONDARY_ACTIVE_COTRANSPORT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fdaa35f99070.js`; view `visualization-eaef119a936e.js` → `Visualization`.

#### Secondary succession ecosystem recovery

Type `SECONDARY_SUCCESSION_ECOSYSTEM_RECOVERY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-58e653f36fa9.js`; view `visualization-2d650a8c6e9c.js` → `SecondarySuccessionEcosystemRecoveryVisualization`.

#### Seed dispersal adaptations: wings and hooks

A parent flowering plant beside a winged seed carried in the direction of wind and a different hooked seed caught in animal fur, comparing two seed-dispersal adaptations

Type `PLANT_SEED_DISPERSAL_ADAPTATIONS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-b6c0eab2709a.js`; view `visualization-6ab3b831725a.js` → `Visualization`.

#### Seed dispersal and the next generation

Seed dispersal: one seed leaves a mature parent plant, moves to a different location, and grows into a separate next-generation seedling.

Type `ORGANISM_SEED_DISPERSAL_AND_NEXT_GENERATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-558840ae4c86.js`; view `visualization-8d1d66c1d664.js` → `OrganismSeedDispersalAndNextGenerationVisualization`.

#### Seed germination and seedling growth

Seed germination: water activates a living seed, the root grows downward first, the shoot grows upward, and a rooted seedling develops leaves.

Type `ORGANISM_SEED_GERMINATION_AND_SEEDLING_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-328a29e06d5b.js`; view `visualization-5ad612e5a649.js` → `OrganismSeedGerminationAndSeedlingGrowthVisualization`.

#### Seed germination: root before shoot

One living seed taking up water, sending a radicle root downward first, then growing an upward shoot and first leaves

Type `PLANT_SEED_GERMINATION_ROOT_BEFORE_SHOOT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cf3233c2081b.js`; view `visualization-4e7d9d6a1588.js` → `Visualization`.

#### Selective channel and carrier proteins

Type `MEMBRANE_CHANNEL_CARRIER_SPECIFICITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a215e928bcb4.js`; view `visualization-323d4213f878.js` → `Visualization`.

#### Selective permeability of the plasma membrane

Type `MEMBRANE_SELECTIVE_PERMEABILITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1ee3bc06b9f4.js`; view `visualization-660c3632d27f.js` → `Visualization`.

#### Semiconservative DNA replication

Type `DNA_REPLICATION_SEMICONSERVATIVE_INHERITANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-865ce1221646.js`; view `visualization-7a4cd4a93d6a.js` → `DnaReplicationSemiconservativeInheritanceVisualization`.

#### Sensory adaptation in phasic and tonic receptors

Type `SENSORY_ADAPTATION_PHASIC_TONIC_RECEPTORS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d74c69b35ab6.js`; view `visualization-14dda78d3fd9.js` → `Visualization`.

#### Sensory population recruitment and stimulus intensity

Type `SENSORY_POPULATION_RECRUITMENT_INTENSITY_CODING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-44bde8bcd42d.js`; view `visualization-3c5a36c71e50.js` → `Visualization`.

#### Sensory receptor potential and firing threshold

Type `SENSORY_RECEPTOR_POTENTIAL_THRESHOLD` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-66bccf0a3d32.js`; view `visualization-cfb318c44eae.js` → `Visualization`.

#### Sensory stimulus intensity frequency coding

Type `SENSORY_STIMULUS_INTENSITY_FREQUENCY_CODING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c00f95c080db.js`; view `visualization-2c9de6b44538.js` → `Visualization`.

#### Separate meiotic cells compare two equally likely independent-assortment orientations

Type `METAPHASE_ONE_INDEPENDENT_ASSORTMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e36233912456.js`; view `visualization-c5d1958ef0a3.js` → `Visualization`.

#### Sequential colonization of land by life

Type `SEQUENTIAL_COLONIZATION_OF_LAND_BY_LIFE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-61c57c98ee7f.js`; view `visualization-8e1aeff1a37e.js` → `SequentialColonizationOfLandByLifeVisualization`.

#### Sexual versus asexual animal reproduction

Sexual versus asexual animal reproduction: Some animals such as hydra reproduce asexually by budding from one parent, whereas sexual reproduction forms a zygote through the fusion of two gametes carrying distinguishable parental contributions.

Type `ANIMAL_SEXUAL_VERSUS_ASEXUAL_REPRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7a5959e73df1.js`; view `visualization-fac066aaba29.js` → `AnimalSexualVersusAsexualReproductionVisualization`.

#### Shade avoidance red/far-red signaling

Type `SHADE_AVOIDANCE_RED_FAR_RED_SIGNALING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-41099eb227b7.js`; view `visualization-38f2e89af665.js` → `Visualization`.

#### Shape-dependent protein function is lost during denaturation

Type `PROTEIN_DENATURATION_UNFOLDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-531ada35ff78.js`; view `visualization-f25107c471b6.js` → `ProteinDenaturationUnfoldingVisualization`.

#### Shared derived character inheritance

Type `SHARED_DERIVED_CHARACTER_INHERITANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e04eaf16d16a.js`; view `visualization-27e08b4d55e3.js` → `Visualization`.

#### Shared derived characters define nested clades

Type `SHARED_DERIVED_CHARACTER_CLADE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9577d13255f9.js`; view `visualization-f0f6eea17b28.js` → `Visualization`.

#### Shared signal transduction can alter a cytoplasmic enzyme or nuclear gene expression

Cellular response comparison: one membrane receptor and shared intracellular relay branch toward a cytoplasmic enzyme-activity response or a nucleus-associated gene-expression response.

Type `SIGNAL_RESPONSE_GENE_EXPRESSION_VERSUS_ENZYME_ACTIVATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e3a99bb3880b.js`; view `visualization-d46de40b5572.js` → `Visualization`.

#### Short-wavelength excitation causes longer-wavelength fluorescence

Type `MICROSCOPY_FLUORESCENCE_EXCITATION_EMISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-daa2567423cb.js`; view `visualization-fd3561895eaa.js` → `Visualization`.

#### Sigmoidal hemoglobin oxygen saturation at tissues and lungs

Hemoglobin oxygen dissociation curve: oxygen availability increases along the horizontal axis and hemoglobin saturation rises sigmoidally; the lower-oxygen tissue region is steep and supports unloading, while the high-oxygen lung region forms a high-saturation loading plateau.

Type `ANIMAL_HEMOGLOBIN_OXYGEN_DISSOCIATION_CURVE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6de633b923d6.js`; view `visualization-7144fd77f15d.js` → `AnimalHemoglobinOxygenDissociationCurveVisualization`.

#### Silent missense and nonsense outcomes

Type `MUTATION_SUBSTITUTION_OUTCOMES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a914b2788b8b.js`; view `visualization-a0360518ffb5.js` → `Visualization`.

#### Silent synonymous substitution

Type `MUTATION_SILENT_SUBSTITUTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-21952aa7c1c4.js`; view `visualization-ebf30da2b2af.js` → `Visualization`.

#### Simple diffusion across a plasma membrane

Type `SIMPLE_DIFFUSION_ACROSS_MEMBRANE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1c85b0dfed0f.js`; view `visualization-8e82afdcdf03.js` → `Visualization`.

#### Simple versus stratified epithelium

Type `EPITHELIAL_SIMPLE_VERSUS_STRATIFIED_BARRIERS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-96827e41dc93.js`; view `visualization-bbc6f20fa612.js` → `EpithelialSimpleVersusStratifiedBarriersVisualization`.

#### Single-base substitution

Type `MUTATION_BASE_SUBSTITUTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-aad7ce449b9a.js`; view `visualization-1eb8c67da9b5.js` → `Visualization`.

#### Sinoatrial initiation, atrioventricular delay, and ventricular conduction

Cardiac electrical-conduction animation: one impulse starts at the sinoatrial node, activates the atria, pauses at the atrioventricular node, and then splits through both ventricular conduction branches to coordinate ventricular contraction.

Type `ANIMAL_CARDIAC_ELECTRICAL_CONDUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ef881225bb1f.js`; view `visualization-6a2e1abe937b.js` → `AnimalCardiacElectricalConductionVisualization`.

#### Sister taxa and their exclusive ancestor

Type `PHYLOGENETIC_SISTER_TAXA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ec96b26e46c4.js`; view `visualization-158892e10e1c.js` → `Visualization`.

#### Skeletal-muscle structural organization

Type `MUSCULOSKELETAL_SKELETAL_MUSCLE_ORGANIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-baed8a5b88f8.js`; view `visualization-ffbf4dab79bf.js` → `MusculoskeletalSkeletalMuscleOrganizationVisualization`.

#### Skin and mucosal barrier defense

How can skin and mucus stop a pathogen before infection? Explain why intact epithelium, mucus trapping, and directed surface clearance prevent pathogens from reaching internal tissue.

Type `SKIN_MUCUS_PHYSICAL_CHEMICAL_BARRIERS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f00157b0e889.js`; view `visualization-3bca0b23f296.js` → `SkinMucusPhysicalChemicalBarriersVisualization`.

#### Skin layers and accessory structures

Type `INTEGUMENT_SKIN_LAYERS_AND_ACCESSORY_STRUCTURES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9b37492c65f2.js`; view `visualization-3df27b590da6.js` → `IntegumentSkinLayersAndAccessoryStructuresVisualization`.

#### Small-scale DNA mutations

Type `MUTATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f22d40e897cf.js`; view `visualization-28cfe0c50415.js` → `Visualization`.

#### Smooth and folded membranes with the same projected cell width

Type `CELL_SIZE_MEMBRANE_FOLDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3cf3e2230e6f.js`; view `visualization-48d9aa6d039c.js` → `CellSizeMembraneFoldingVisualization`.

#### Sodium-potassium pump active transport

Type `SODIUM_POTASSIUM_ACTIVE_TRANSPORT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-53c5621a933e.js`; view `visualization-9aab575d9d90.js` → `Visualization`.

#### Somatic versus autonomic motor pathways

A somatic motor neuron travels directly from the central nervous system to skeletal muscle, while an autonomic motor pathway uses two neurons joined in a peripheral ganglion.

Type `SOMATIC_VERSUS_AUTONOMIC_MOTOR_PATHWAYS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-504118e2c088.js`; view `visualization-970caa4ad125.js` → `SomaticVersusAutonomicMotorPathwaysVisualization`.

#### Somatotopic sensory cortical representation

Type `SENSORY_SOMATOTOPIC_CORTICAL_REPRESENTATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c53cdcd511d8.js`; view `visualization-ae3daa0f0598.js` → `Visualization`.

#### Specialized nerve, muscle, and secretory structures support different functions

Specialized cell structure and function: a neuron uses its long axon to signal, a muscle cell uses aligned fibers to contract, and a secretory cell exports protein-containing vesicles.

Type `SPECIALIZED_CELL_STRUCTURE_AND_FUNCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ad726e2626ee.js`; view `visualization-f1ef56399b50.js` → `Visualization`.

#### Sperm versus egg specialization

Sperm versus egg specialization: Animal sperm and eggs are both haploid gametes but differ in structure and role: sperm have a compact genetic head, energy-supporting midpiece, and motile flagellum, while the larger oocyte supplies a haploid nucleus, abundant cytoplasm, and resources for early development.

Type `ANIMAL_SPERM_VERSUS_EGG_SPECIALIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2264e623055f.js`; view `visualization-df7b7714605a.js` → `AnimalSpermVersusEggSpecializationVisualization`.

#### Spermatogenesis versus oogenesis

Spermatogenesis versus oogenesis: Both spermatogenesis and oogenesis use meiosis to generate haploid cells. Spermatogenesis partitions cytoplasm relatively evenly among four functional sperm, whereas oogenesis retains most cytoplasm in one functional egg and partitions the remaining chromosome sets into small polar bodies; exact polar-body number can vary.

Type `ANIMAL_SPERMATOGENESIS_VERSUS_OOGENESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-486c524c8a25.js`; view `visualization-d74e1b8d5a23.js` → `AnimalSpermatogenesisVersusOogenesisVisualization`.

#### Spindle checkpoint requires bipolar attachment before anaphase

Type `SPINDLE_ASSEMBLY_CHECKPOINT_ATTACHMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ac9239514bc7.js`; view `visualization-9d068e78060d.js` → `Visualization`.

#### Sponge filter feeding

Type `ANIMAL_SPONGE_FILTER_FEEDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9013930a3d2c.js`; view `visualization-9b8d14d534ff.js` → `AnimalSpongeFilterFeedingVisualization`.

#### Squamous, cuboidal, and columnar epithelial cells

Type `EPITHELIAL_SQUAMOUS_CUBOIDAL_COLUMNAR_CELL_SHAPES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dfd608ddf1e1.js`; view `visualization-78e8547a0fc5.js` → `EpithelialSquamousCuboidalColumnarCellShapesVisualization`.

#### Stable allele frequencies across generations

Type `POPULATION_GENETICS_EQUILIBRIUM_ACROSS_GENERATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7ccbb2803f74.js`; view `visualization-97852b0c0e20.js` → `Visualization`.

#### Stem vascular-bundle cross section

Flowering-plant stem cross section showing an outer epidermis, surrounding ground tissue, a central pith, and a ring of vascular bundles with xylem toward the center and phloem toward the outside

Type `PLANT_STEM_VASCULAR_BUNDLE_CROSS_SECTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bbfe8c75e571.js`; view `visualization-c54206d952ba.js` → `Visualization`.

#### Stem-cell differentiation: neuronal gene expression precedes specialized structure

Stem-cell differentiation: an unspecialized stem cell retains the same genome, activates neuronal gene expression, and then acquires specialized neuron structure.

Type `STEM_CELL_DIFFERENTIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a029640dedb7.js`; view `visualization-e72b8ca97d8b.js` → `Visualization`.

#### Stem-cell potency narrows from totipotent to a restricted neuronal lineage

Stem-cell potency and lineage restriction: totipotent cells can form all tissues, pluripotent cells retain multiple body-cell fates, and a multipotent neuronal progenitor produces its related neuronal lineage while preserving the same genome.

Type `STEM_CELL_POTENCY_AND_LINEAGE_RESTRICTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7dcb52ef948e.js`; view `visualization-750b4ac568fc.js` → `Visualization`.

#### Stored fossil carbon, human combustion, and atmospheric accumulation

Why does releasing long-stored fossil carbon increase atmospheric carbon dioxide? Predict that rapid transfer of carbon from long-term geological storage to the atmosphere increases atmospheric carbon dioxide when removal does not keep pace.

Type `BIOGEOCHEMICAL_CARBON_FOSSIL_FUEL_IMBALANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-96d9ff82458b.js`; view `visualization-f109abe1d2f4.js` → `Visualization`.

#### Stored seed food supports growth until first true leaves develop

Seed food reserves: stored food is visibly depleted while the first root and upward shoot grow, then the first true leaves use sunlight to begin making new food.

Type `ORGANISM_SEED_RESERVES_TO_FIRST_LEAVES` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-525177d04c19.js`; view `visualization-39ede8e270c5.js` → `OrganismSeedReservesToFirstLeavesVisualization`.

#### Substrate concentration raises enzyme activity until active sites saturate

Type `ENZYME_SUBSTRATE_SATURATION_KINETICS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-191de9d49e6a.js`; view `visualization-a386263cca71.js` → `Visualization`.

#### Sugar-phosphate backbone

A nucleic-acid strand runs from its 5-prime end to its 3-prime end through repeating sugars and phosphates, while the attached A, G, T, and C bases carry sequence information.

Type `SUGAR_PHOSPHATE_BACKBONE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1ca029de8929.js`; view `visualization-fc45830a6cf7.js` → `Visualization`.

#### Sulfhydryl groups forming a disulfide bond

Type `BIOLOGICAL_SULFHYDRYL_DISULFIDE_BOND_FORMATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bd6cdbdaf26f.js`; view `visualization-c976de58fd37.js` → `Visualization`.

#### Sunlight energy travels through food to animal activity and heat

Sunlight energy enters a plant, travels in plant-made food to an animal, and emerges as usable energy and heat while food matter remains distinct.

Type `SUNLIGHT_FOOD_ENERGY_AND_HEAT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-eac0a546ddd0.js`; view `visualization-3def9df8f7ba.js` → `Visualization`.

#### Superficial skin regeneration versus deeper collagen scarring

Type `SKIN_SUPERFICIAL_REGENERATION_VERSUS_DEEP_SCAR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-85dba1f309e2.js`; view `visualization-e1535542b355.js` → `SkinSuperficialRegenerationVersusDeepScarVisualization`.

#### sustainable-fisheries-harvest-population-recovery

Type `SUSTAINABLE_FISHERIES_HARVEST_POPULATION_RECOVERY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1776f8d89e90.js`; view `visualization-e08c6ba3d012.js` → `SustainableFisheriesHarvestPopulationRecoveryVisualization`.

#### Sweat and sebaceous glands use different secretion routes

Type `INTEGUMENT_SWEAT_VERSUS_SEBACEOUS_GLAND_SECRETION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3b01ed20948d.js`; view `visualization-83749f45c907.js` → `IntegumentSweatVersusSebaceousGlandSecretionVisualization`.

#### Sweating and evaporative cooling

Type `SKIN_SWEAT_EVAPORATION_COOLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-da74e4fc3144.js`; view `visualization-54b386449592.js` → `SkinSweatEvaporationCoolingVisualization`.

#### Symbiosis outcome comparison

Type `SYMBIOSIS_OUTCOME_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fccea7da84e7.js`; view `visualization-92f8fa12471c.js` → `SymbiosisOutcomeComparisonVisualization`.

#### Sympathetic adrenal medulla response

Type `SYMPATHETIC_ADRENAL_MEDULLA_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4ad7a58993ce.js`; view `visualization-a17109a7dc40.js` → `Visualization`.

#### Synovial-joint structure

Type `MUSCULOSKELETAL_SYNOVIAL_JOINT_CARTILAGE_AND_FLUID` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-24211dc7b30e.js`; view `visualization-33f4a1e7192f.js` → `MusculoskeletalSynovialJointCartilageAndFluidVisualization`.

#### Systemic blood pressure falls most steeply across resistance arterioles

Systemic blood-pressure gradient: a connected route leads from the heart through an artery, narrow resistance arteriole, capillary, and vein; pressure starts high in the artery, drops most steeply across the arteriole, and remains low through capillaries and veins.

Type `ANIMAL_SYSTEMIC_BLOOD_PRESSURE_GRADIENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-73b3d9f0adfb.js`; view `visualization-c65c4f82613a.js` → `AnimalSystemicBloodPressureGradientVisualization`.

#### Systemic capillary exchange at body tissues

Animated systemic capillary exchange: oxygen-rich blood brings oxygen and absorbed food nutrients to a body cell, carbon dioxide produced by the cell returns into the blood, and the same blood becomes oxygen-poor at the tissue.

Type `ANIMAL_SYSTEMIC_CAPILLARY_TISSUE_EXCHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ecf6f560f3a3.js`; view `visualization-ea83d3148d95.js` → `AnimalSystemicCapillaryTissueExchangeVisualization`.

#### Temporal versus spatial summation

Temporal summation combines closely repeated inputs from one synapse, while spatial summation combines simultaneous inputs from separate synapses; both can reach neuronal firing threshold.

Type `TEMPORAL_VERSUS_SPATIAL_SUMMATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-17ac95f695ab.js`; view `visualization-5c64fb6a4a46.js` → `TemporalVersusSpatialSummationVisualization`.

#### Ten and twenty percent recombination correspond to unequal linked chromosome intervals

Type `LINKAGE_DISTANCE_AND_RECOMBINATION_FREQUENCY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5c06b35a88e6.js`; view `visualization-c5828d627678.js` → `LinkageDistanceAndRecombinationFrequencyVisualization`.

#### Tendril thigmotropism and touch coiling

Type `TENDRIL_THIGMOTROPISM_TOUCH_COILING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-581b22ad7267.js`; view `visualization-fd5e6a393709.js` → `Visualization`.

#### The same DNA sequence is compared in tightly packed inaccessible chromatin and open accessible chromatin with RNA polymerase and transcript output.

Type `CHROMATIN_ACCESSIBILITY_GENE_EXPRESSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e6bc5423dc0f.js`; view `visualization-7261a285a63e.js` → `Visualization`.

#### The same food and oxygen atoms rearrange as separate energy is released

The same carbon, hydrogen, and oxygen atoms in food and oxygen regroup as carbon dioxide and water while energy is released separately.

Type `MATTER_IS_REARRANGED_ENERGY_IS_RELEASED` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d646e6416600.js`; view `visualization-4bbed9d88a32.js` → `Visualization`.

#### The same neuronal gene is accessible in a neuron and compact in a muscle cell

Cell-specific chromatin accessibility: the same neuronal gene is open and transcribed in a nerve cell but compact and comparatively silent in a muscle cell.

Type `CHROMATIN_ACCESSIBILITY_AND_CELL_IDENTITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5db16323776f.js`; view `visualization-70daa8e3e0f7.js` → `Visualization`.

#### The same received signal activates different intracellular pathways in two target cells

Pathway-specific cell responses: two target cells bind the same extracellular signal, but different intracellular signaling proteins produce enzyme activation in one cell and gene expression in the other.

Type `PATHWAY_SPECIFIC_CELL_RESPONSES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-76490f668ce8.js`; view `visualization-76f8db0bfeeb.js` → `Visualization`.

#### Three additive genes create seven dosage classes and a symmetric 1:6:15:20:15:6:1 distribution

Type `POLYGENIC_INHERITANCE_CONTINUOUS_VARIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-86cd0157a229.js`; view `visualization-a80ff00b88fa.js` → `PolygenicInheritanceContinuousVariationVisualization`.

#### Three AP Biology amino-acid R-group categories

Type `AMINO_ACID_SIDE_CHAIN_PROPERTIES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8d32179b3852.js`; view `visualization-b6a5d4b98e13.js` → `AminoAcidSideChainPropertiesVisualization`.

#### Three domains and common ancestry

Type `LIFE_THREE_DOMAINS_AND_COMMON_ANCESTOR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-83c27ef11d12.js`; view `visualization-e1434443ce83.js` → `Visualization`.

#### Three generations of connected autosomal dominant Aa-to-child transmission

Type `MENDELIAN_AUTOSOMAL_DOMINANT_PEDIGREE_TRANSMISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9dcc2e8e146d.js`; view `visualization-da557e7b2303.js` → `Visualization`.

#### Three levels of biodiversity

Type `BIODIVERSITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fc8da6ee3c53.js`; view `visualization-4fe0ecc7eb99.js` → `Visualization`.

#### Three ordered protein kinases use separate ATP phosphates and reversible phosphatase activity

Phosphorylation cascade architecture: an activated receptor feeds three ordered protein kinases, each phosphorylation uses a separate ATP-derived phosphate, a phosphatase removes phosphate, and the final kinase activates a response.

Type `PHOSPHORYLATION_CASCADE_ARCHITECTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-72787eb264c0.js`; view `visualization-dbc6630fd6d6.js` → `Visualization`.

#### Three population-level ABO alleles and four two-allele blood phenotypes

Type `ABO_MULTIPLE_ALLELES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f3b8a5dd0737.js`; view `visualization-d29b07dd72d5.js` → `AboMultipleAllelesVisualization`.

#### Three separate ATP-derived phosphates sequentially activate a protein-kinase cascade

Phosphorylation cascade animation: three separate ATP-derived phosphates activate three protein kinases one after another, and the last activated kinase turns on the downstream response.

Type `PHOSPHORYLATION_CASCADE_ACTIVATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4ccd6d7b7174.js`; view `visualization-b2d829927dc9.js` → `Visualization`.

#### Three-prime poly-A tail addition

Type `THREE_PRIME_POLY_A_TAIL_ADDITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b41904e68997.js`; view `visualization-9e070d66a266.js` → `Visualization`.

#### Tight junction blocks the route between adjacent animal cells

One extracellular molecule approaches the space between neighboring animal cells and stops at a tight-junction seal that blocks the paracellular route.

Type `TIGHT_JUNCTION_BARRIER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4bf6420bb5b4.js`; view `visualization-c443582d66ea.js` → `Visualization`.

#### Tight-junction epithelial barrier

Type `EPITHELIAL_TIGHT_JUNCTION_SELECTIVE_BARRIER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b152dcc3c867.js`; view `visualization-dcfd6ed85db3.js` → `EpithelialTightJunctionSelectiveBarrierVisualization`.

#### Tip order versus evolutionary relatedness

Type `PHYLOGENETIC_TIP_ORDER_MISCONCEPTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dd16ce5a35d7.js`; view `visualization-644e5bd3e1af.js` → `Visualization`.

#### Tissue fluid, lymph-node immunity, and venous return

Lymphatic fluid-return animation: fluid leaves a blood capillary for body tissue, enters a blind-ended one-way lymph vessel, passes a white blood cell inside a lymph node, and returns through a lymphatic duct into systemic venous blood.

Type `ANIMAL_LYMPHATIC_FLUID_RETURN_AND_IMMUNITY` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-851682e94321.js`; view `visualization-bd4dc20e65f5.js` → `AnimalLymphaticFluidReturnAndImmunityVisualization`.

#### Total microscope magnification

Type `MICROSCOPY_OBJECTIVE_EYEPIECE_TOTAL_MAGNIFICATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-73bc95687614.js`; view `visualization-8980d4a50482.js` → `Visualization`.

#### Tracing a most recent common ancestor

Type `PHYLOGENETIC_COMMON_ANCESTOR_TRACING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1f8990b5904a.js`; view `visualization-7d040ce278e9.js` → `Visualization`.

#### Transcription and RNA processing

Type `TRANSCRIPTION_AND_RNA_PROCESSING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7a6838122995.js`; view `visualization-d1c47facb489.js` → `Visualization`.

#### Transcription elongation and RNA synthesis

Type `TRANSCRIPTION_ELONGATION_RNA_SYNTHESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ac3675c15171.js`; view `visualization-b4bdda258086.js` → `Visualization`.

#### Transcription termination and RNA release

Type `TRANSCRIPTION_TERMINATION_RNA_RELEASE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-caaa65c169e6.js`; view `visualization-b696db3f8c98.js` → `Visualization`.

#### Transcription unit promoter and terminator

Type `TRANSCRIPTION_UNIT_PROMOTER_TERMINATOR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d11021362679.js`; view `visualization-50077be4c29f.js` → `Visualization`.

#### Translation elongation: A-site entry, peptide transfer, translocation

Type `TRANSLATION_ELONGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-336e52c18ea4.js`; view `visualization-43203e15a02a.js` → `TranslationElongationVisualization`.

#### Translation initiation: AUG, initiator methionine, and P site

Type `TRANSLATION_INITIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b956405a451b.js`; view `visualization-6be5cc22b164.js` → `TranslationInitiationVisualization`.

#### Translation termination: UAA, release factor, and released peptide

Type `TRANSLATION_TERMINATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-10ad0f646a17.js`; view `visualization-38d0c8f0296a.js` → `TranslationTerminationVisualization`.

#### Translation: mRNA, ribosome, tRNA, and polypeptide

Type `TRANSLATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7d1063d05668.js`; view `visualization-f88a4ddaa263.js` → `TranslationVisualization`.

#### Transmission electron microscopy versus scanning electron microscopy

Type `MICROSCOPY_TEM_VERSUS_SEM_IMAGING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-44ea58ea7d6f.js`; view `visualization-a379e61aa5d7.js` → `Visualization`.

#### Transpiration pull and cohesive xylem water

Water evaporates from a leaf, and a connected column of water molecules moves upward through the same xylem vessel toward the leaf

Type `PLANT_XYLEM_TRANSPIRATION_COHESION_PULL` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b52ed19f6540.js`; view `visualization-489f880c8d0e.js` → `Visualization`.

#### Triglyceride structure

Type `TRIGLYCERIDE_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d48e755453d9.js`; view `visualization-3b3ef7e83fab.js` → `TriglycerideStructureVisualization`.

#### Trophic transfer efficiency and heat loss

Type `TROPHIC_TRANSFER_EFFICIENCY_AND_HEAT_LOSS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f26d8b834324.js`; view `visualization-be57e377c52a.js` → `Visualization`.

#### Two copies of the same regulatory sequence compare weak transcription with one activator against stronger expression when the full transcription-factor combination binds.

Type `TRANSCRIPTION_FACTOR_COMBINATORIAL_CONTROL` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9bb95b49538f.js`; view `visualization-4720a67f980b.js` → `Visualization`.

#### Two independently assorting chromosome pairs produce four possible haploid parental-origin combinations across meioses

Type `GAMETE_CHROMOSOME_COMBINATION_DIVERSITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ed582bc170d9.js`; view `visualization-637c3b1c1905.js` → `Visualization`.

#### Two independently oriented homologous pairs segregate into complementary mixed-origin cells

Type `INDEPENDENT_ASSORTMENT_CHROMOSOME_SEGREGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9e2e4f96d5df.js`; view `visualization-1890ce5180ff.js` → `Visualization`.

#### Two recognizable eukaryotic cells retain the same genome while different regulatory states activate different genes and produce different proteins.

Type `CELL_TYPE_SPECIFIC_GENE_EXPRESSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9b624db869d2.js`; view `visualization-db0e8e3832cb.js` → `Visualization`.

#### Type I, II, and III ecological survivorship curves

Type `POPULATION_ECOLOGY_SURVIVORSHIP_CURVES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-faa491a1c84a.js`; view `visualization-7bc3f918c481.js` → `Visualization`.

#### Undirected isopod kinesis and favorable-habitat retention

Type `KINESIS_ENVIRONMENTAL_ACCUMULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-db92c466be6e.js`; view `visualization-716fc7bf4760.js` → `KinesisEnvironmentalAccumulationVisualization`.

#### Unscaled branch length versus relatedness

Type `PHYLOGENETIC_BRANCH_LENGTH_MISCONCEPTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5b89cbee5ff6.js`; view `visualization-a025218513f4.js` → `Visualization`.

#### Vaccine-induced immune memory

How can a vaccine prepare a faster response without requiring the disease? Explain how exposure to a vaccine antigen establishes antigen-specific adaptive memory that supports a faster response to later encounter with the matching pathogen.

Type `VACCINE_INDUCED_IMMUNE_MEMORY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d5f1f871ded8.js`; view `visualization-b23b4166288f.js` → `VaccineInducedImmuneMemoryVisualization`.

#### Vertebrate diversity and adaptations

Type `VERTEBRATE_DIVERSITY_AND_ADAPTATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-79df90570682.js`; view `visualization-1d2d69415eb6.js` → `Visualization`.

#### Vertebrate shared derived innovation cladogram

Type `VERTEBRATE_SHARED_DERIVED_INNOVATION_CLADOGRAM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-18c1051b36a2.js`; view `visualization-b0327b7d8628.js` → `Visualization`.

#### Vertebrate skin and reproduction on land

Type `VERTEBRATE_SKIN_AND_REPRODUCTION_ON_LAND` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-59d01fc89060.js`; view `visualization-a2125419ccb8.js` → `Visualization`.

#### Vestibular rotation and hair-cell signaling

Type `SENSORY_VESTIBULAR_ROTATION_HAIR_CELL_SIGNALING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5101f91c02b7.js`; view `visualization-8b63d97095a5.js` → `Visualization`.

#### Viruses and prokaryotes

Type `VIRUSES_AND_PROKARYOTES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-88107789d63f.js`; view `visualization-3164a031e8e6.js` → `VirusesAndProkaryotesVisualization`.

#### Visual sensory pathway from retina to cortex

Type `SENSORY_VISUAL_RETINA_CORTEX_PATHWAY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d2beaf09ff5a.js`; view `visualization-3a7e7f2c9356.js` → `Visualization`.

#### Water adhesion and capillary rise

Type `WATER_ADHESION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b98b5f150a4c.js`; view `visualization-7d7feae6b5a6.js` → `Visualization`.

#### Water autoionization, hydronium, and hydroxide

Type `BIOLOGICAL_WATER_AUTOIONIZATION_HYDRONIUM_HYDROXIDE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-978d8b153dc0.js`; view `visualization-d33dc2b30451.js` → `Visualization`.

#### Water high heat of vaporization and evaporative cooling

Type `WATER_EVAPORATIVE_COOLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-10560b6b1e94.js`; view `visualization-7d17223c58db.js` → `Visualization`.

#### Water infiltration, groundwater movement, and surface discharge

How can precipitation return to surface water through groundwater? Trace one conserved water marker through precipitation, infiltration, connected soil pore spaces, groundwater movement, and discharge into surface water.

Type `BIOGEOCHEMICAL_WATER_INFILTRATION_AND_GROUNDWATER_RETURN` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-34fa4d2188aa.js`; view `visualization-4260f04b2041.js` → `Visualization`.

#### Water molecule polarity

Type `WATER_MOLECULE_POLARITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3f98a719cdac.js`; view `visualization-d70f5c19910c.js` → `Visualization`.

#### Water phase changes and return pathways

How can one water molecule evaporate, condense, precipitate, and return to surface water? Trace the same water through evaporation, condensation, precipitation, and surface runoff while distinguishing movement between reservoirs from changes of state.

Type `BIOGEOCHEMICAL_WATER_PHASE_CHANGE_AND_RETURN` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-55b70b78423f.js`; view `visualization-ddba339554e4.js` → `Visualization`.

#### Water structure and hydrogen bonding

Type `STRUCTURE_OF_WATER_HYDROGEN_BONDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-30b271c923a2.js`; view `visualization-2fe6e66e5323.js` → `Visualization`.

#### Water surface tension

Type `WATER_SURFACE_TENSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-900de7db375d.js`; view `visualization-2a76987a8725.js` → `Visualization`.

#### Water-soluble surface receptors versus lipid-soluble internal receptors

A water-soluble signal stays outside and binds a surface receptor, while a lipid-soluble signal crosses the membrane to bind an intracellular receptor.

Type `CELL_RECEPTOR_LOCATION_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-44959a606b0f.js`; view `visualization-10246091ef4a.js` → `CellReceptorLocationComparisonVisualization`.

#### When lactose is already present and glucose falls, cAMP binds CAP, the CAP–cAMP complex recruits RNA polymerase, and lac transcription increases.

Type `LAC_OPERON_CATABOLITE_ACTIVATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c7643a3d5e8b.js`; view `visualization-bac5b6b29247.js` → `Visualization`.

#### Whole-organism cooling restores temperature toward a set point

Type `PHYSIOLOGICAL_THERMOREGULATION_NEGATIVE_FEEDBACK` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d71d53aba559.js`; view `visualization-5703247b3981.js` → `PhysiologicalThermoregulationNegativeFeedbackVisualization`.

#### Why a whale is a mammal, not a fish

Type `VERTEBRATE_WHALE_MAMMAL_NOT_FISH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3ccbde9870dd.js`; view `visualization-1d9a59e0ecd3.js` → `Visualization`.

#### Why small cells exchange materials efficiently

Type `CELL_SIZE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5573d3c7efeb.js`; view `visualization-e46955460b06.js` → `CellSizeVisualization`.

#### Withdrawal-reflex sensory and motor response

A painful hand stimulus travels along a sensory neuron into the spinal cord. A spinal interneuron activates a motor neuron, skeletal muscle contracts, and the same hand withdraws before conscious brain processing is needed.

Type `WITHDRAWAL_REFLEX_SENSORY_MOTOR_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e55422374e65.js`; view `visualization-799cd963d33b.js` → `WithdrawalReflexSensoryMotorResponseVisualization`.

#### Xylem and phloem transport comparison

One flowering plant comparing upward xylem water transport from roots with phloem sugar movement from a source leaf toward both shoot and root sinks

Type `PLANT_XYLEM_PHLOEM_TRANSPORT_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9fa238b86f42.js`; view `visualization-398413438969.js` → `Visualization`.

#### Xylem water and transpiration stream

One continuous water marker moving from roots upward through stem xylem to a leaf and leaving as transpired water vapor

Type `PLANT_XYLEM_WATER_TRANSPIRATION_STREAM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f380070a883b.js`; view `visualization-8c752965a322.js` → `Visualization`.

#### Yeast budding reproduction

Type `YEAST_BUDDING_REPRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-76a5aa97f57d.js`; view `visualization-1ed61c610ed5.js` → `Visualization`.

### Other views (no three.js or Lottie dependency) (809)

#### Abo rh blood typing

Type `ABO_RH_BLOOD_TYPING` · manifest v2.

Parameters: `initial_blood_type` (enum, default `A+`, one of `O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`).

Source: manifest `model-20fa5aabbc94.js`; view `visualization-20e6f7af8635.js` → `AboRhBloodTypingVisualization`.

#### Abo rh transfusion compatibility

Type `ABO_RH_TRANSFUSION_COMPATIBILITY` · manifest v1.

Parameters: `donorType` (enum, default `A+`, one of `O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`); `recipientType` (enum, default `B-`, one of `O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`).

Source: manifest `type-99cca3d49ce0.js`; view `visualization-d968674df25d.js` → `AboRhTransfusionVisualization`.

#### Absorbance spectrum

Measurement wavelength

Type `ABSORBANCE_SPECTRUM` · manifest v4.

Parameters: `lambda_max_nm` (number, default `520`, range 210 to 740).

Source: manifest `type-dfeec9c7c75e.js`; view `visualization-13c18ed7b61a.js` → `Visualization`.

#### Absorption variable costing inventory profit: `\mathrm{OI}_{A}-\mathrm{OI}_{V}=\Delta I\times \mathrm{FOH}_{u}`

Type `ABSORPTION_VARIABLE_COSTING_INVENTORY_PROFIT` · manifest v3 · formula `\mathrm{OI}_{A}-\mathrm{OI}_{V}=\Delta I\times \mathrm{FOH}_{u}`.

Parameters: `unitsProduced` (integer, default `800`, range 100 to 10000); `unitsSold` (integer, default `600`, range 100 to 10000).

Source: manifest `type-796063db4408.js`; view `visualization-82813b468f36.js` → `AbsorptionVariableCostingVisualization`.

#### Accrual vs cash accounting

Type `ACCRUAL_VS_CASH_ACCOUNTING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-1805a2517dc4.js` → `AccrualVsCashAccountingVisualization`.

#### Accuracy vs precision targets

Average position relative to the reference value

Type `ACCURACY_VS_PRECISION_TARGETS` · manifest v1.

Parameters: `meanPosition` (enum, default `centered`, one of `centered`, `offset`); `measurementSpread` (enum, default `small`, one of `small`, `large`).

Source: manifest `type-c3de85d12da6.js`; view `visualization-b1f3ccba272b.js` → `AccuracyPrecisionVisualization`.

#### Acid base proton transfer

Reaction example

Type `ACID_BASE_PROTON_TRANSFER`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-8e43371ee19a.js` → `Visualization`.

#### Acid base speciation

Diprotic-acid fractional-distribution plot from pH 0 to 14, with pKa1 {pKa1} and pKa2 {pKa2}. At pH {pH}, H2A is {h2a}, HA minus is {ha}, and A two-minus is {a}; {takeaway}.

Type `ACID_BASE_SPECIATION` · manifest v2.

Parameters: `pKa1` (number, default `6.35`, range 0 to 6.5); `pKa2` (number, default `10.33`, range 7.5 to 14).

Source: manifest `model-579301f7f78f.js`; view `visualization-b288075a46d1.js` → `AcidBaseSpeciationVisualization`.

#### Acid base titration

Type `ACID_BASE_TITRATION` · manifest v4.

Parameters: `experiment` (enum, default `strong-strong`, one of `strong-strong`, `strong-weak`, `weak-strong`); `acidVolumeMl` (number, default `0`, range 0 to 20).

Source: manifest `model-b31ccf83cf9c.js`; view `visualization-725e91ef6dcb.js` → `AcidBaseTitrationVisualization`.

#### Acid deposition

Acid-deposition pathway stage

Type `ACID_DEPOSITION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b4e02541a51d.js` → `Visualization`.

#### Acid strength and conjugate base stability

Acidity comparison

Type `ACID_STRENGTH_AND_CONJUGATE_BASE_STABILITY` · manifest v2.

Parameters: `comparison` (enum, default `resonance`, one of `resonance`, `inductive`, `atom-trend`, `hybridization`).

Source: manifest `model-7206de562b9d.js`; view `visualization-9418a3f384c2.js` → `Visualization`.

#### Action potential neuron

Action potential stage

Type `ACTION_POTENTIAL_NEURON`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-fe9e86d84676.js` → `Visualization`.

#### Action potential nodes

Action potential position

Type `ACTION_POTENTIAL_NODES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-20297b348465.js` → `ActionPotentialNodesVisualization`.

#### Action potential voltage

Type `ACTION_POTENTIAL_VOLTAGE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-6ccb195649f7.js` → `ActionPotentialVoltageVisualization`.

#### Activation energy distribution

Temperature in kelvin

Type `ACTIVATION_ENERGY_DISTRIBUTION` · manifest v4.

Parameters: `initial_temperature_k` (number, default `600`, range 300 to 900); `activation_energy_kj_mol` (number, default `16`, range 8 to 28).

Source: manifest `type-a73db772b207.js`; view `visualization-f8f0f34b53a8.js` → `ActivationEnergyDistributionVisualization`.

#### Active vs passive immunity

Type `ACTIVE_VS_PASSIVE_IMMUNITY` · manifest v2.

Parameters: `initial_example` (enum, default `vaccination`, one of `infection-and-recovery`, `vaccination`, `maternal-antibodies`, `immune-globulin`).

Source: manifest `model-c57d1e222f54.js`; view `visualization-4fa68b9faa79.js` → `Visualization`.

#### Acute inflammation

Acute inflammation stage

Type `ACUTE_INFLAMMATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-c0dca6f589f6.js` → `AcuteInflammationVisualization`.

#### Acute triangle

Type `ACUTE_TRIANGLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2f43cb7a0505.js` → `AcuteTriangleVisualization`.

#### Add fractions

Type `ADD_FRACTIONS` · manifest v4.

Parameters: `firstNumerator` (integer, default `1`, range 1 to 4); `firstDenominator` (integer, default `3`, range 2 to 6); `secondNumerator` (integer, default `3`, range 1 to 4); `secondDenominator` (integer, default `6`, range 2 to 6).

Source: manifest `type-4b5ff0bb4ae8.js`; view `visualization-cf80e486eed6.js` → `AddFractionsVisualization`.

#### Adding integers

Type `ADDING_INTEGERS` · manifest v1.

Parameters: `firstAddend` (integer, default `3`, range 1 to 12); `secondAddend` (integer, default `6`, range 1 to 12).

Source: manifest `model-1ff2e69cbdc9.js`; view `visualization-9157ac0c8802.js` → `AddingIntegersVisualization`.

#### Adding negative integer

Type `ADDING_NEGATIVE_INTEGER` · manifest v1.

Parameters: `positiveInteger` (integer, default `7`, range 1 to 12); `negativeInteger` (integer, default `-4`, range -12 to -1).

Source: manifest `model-5b5c3055d254.js`; view `visualization-33ebd9a065a1.js` → `AddingNegativeIntegerVisualization`.

#### Adsr envelope

ADSR parameter

Type `ADSR_ENVELOPE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2e13b5e4170c.js` → `AdsrEnvelopeVisualization`.

#### Age structure pyramid

Age-structure pattern

Type `AGE_STRUCTURE_PYRAMID` · manifest v4.

Parameters: `initial_pattern` (enum, default `expansive`, one of `expansive`, `stationary`, `constrictive`).

Source: manifest `type-19661ffd37c1.js`; view `visualization-ba19c2d6797a.js` → `Visualization`.

#### Aggregate demand

Type `AGGREGATE_DEMAND`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-d3d0202d9030.js` → `AggregateDemandVisualization`.

#### Aggregate demand and supply

Aggregate demand position

Type `AGGREGATE_DEMAND_AND_SUPPLY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-1a89a0761f6b.js` → `AdAsEquilibriumVisualization`.

#### Agricultural soil erosion

Erosion stage

Type `AGRICULTURAL_SOIL_EROSION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-3efa47b5742c.js` → `Visualization`.

#### Alcohol oxidation products

Type `ALCOHOL_OXIDATION_PRODUCTS` · manifest v1.

Parameters: `oxidationConditions` (enum, default `dess_martin`, one of `dess_martin`, `jones_reagent`).

Source: manifest `model-9f7763fa34f6.js`; view `visualization-dcb3bcd6f506.js` → `AlcoholOxidationProductsVisualization`.

#### Alkene e z stereochemistry

Type `ALKENE_E_Z_STEREOCHEMISTRY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-164950475e85.js` → `Visualization`.

#### Alkene stereochemical additions

Addition pathway

Type `ALKENE_STEREOCHEMICAL_ADDITIONS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f671ef0ef3fc.js` → `Visualization`.

#### Alveolar gas exchange

Gas to emphasize

Type `ALVEOLAR_GAS_EXCHANGE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f87dcf95bb6c.js` → `AlveolarGasExchangeVisualization`.

#### Amino acids and peptide bonds

Amino-acid pair

Type `AMINO_ACIDS_AND_PEPTIDE_BONDS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e60fa8589b3e.js` → `Visualization`.

#### Angular frequency relation: `\omega = 2\pi f`

Type `ANGULAR_FREQUENCY_RELATION` · manifest v3 · formula `\omega = 2\pi f`, also `\omega = \frac{2\pi}{T}`, `\omega = \frac{d\theta}{dt}`, `\omega = \sqrt{\frac{k}{m}}`, `\omega = \sqrt{k/m}`, `\omega^2 = \frac{k}{m}`, `f = \frac{\omega}{2\pi}`, `T = \frac{2\pi}{\omega}`, `\omega = 2\pi f = \frac{2\pi}{T}`, `(\omega = 2\pi f)`, `2\pi f = \omega`, `w=2pif`, `omega=2pif`, `2pif=omega`, `2pif=w`, `omega = 2 pi f`, `w=2pi/t`, `omega=2pi/t`, `f=w/2pi`, `f=omega/2pi`, `w=dtheta/dt`, `omega=dtheta/dt`, `w=sqrt(k/m)`, `omega=sqrt(k/m)`, `w^2=k/m`, `omega^2=k/m`.

Parameters: `frequency` (number, default `1.5`, range 0.01 to 1000).

Source: manifest `type-dd26222ad182.js`; view `visualization-9167147eddab.js` → `AngularFrequencyRelationVisualization`.

#### Animal life cycle

Animal

Type `ANIMAL_LIFE_CYCLE` · manifest v2.

Parameters: `animal` (enum, default `butterfly`, one of `butterfly`, `frog`, `chicken`, `mammal`).

Source: manifest `type-11d77b78e3d4.js`; view `visualization-9b63ed7beab9.js` → `AnimalLifeCycleVisualization`.

#### Anova decomposition: `F = \frac{\text{between-group variation}}{\text{within-group variation}}`

Data view

Type `ANOVA_DECOMPOSITION` · manifest v4 · formula `F = \frac{\text{between-group variation}}{\text{within-group variation}}`.

Parameters: `groupA1` (number, default `32`, range 0 to 100); `groupA2` (number, default `36`, range 0 to 100); `groupA3` (number, default `38`, range 0 to 100); `groupA4` (number, default `40`, range 0 to 100); `groupA5` (number, default `43`, range 0 to 100); `groupA6` (number, default `45`, range 0 to 100); `groupB1` (number, default `44`, range 0 to 100); `groupB2` (number, default `47`, range 0 to 100); `groupB3` (number, default `49`, range 0 to 100); `groupB4` (number, default `51`, range 0 to 100); `groupB5` (number, default `53`, range 0 to 100); `groupB6` (number, default `56`, range 0 to 100); `groupC1` (number, default `55`, range 0 to 100); `groupC2` (number, default `58`, range 0 to 100); `groupC3` (number, default `60`, range 0 to 100); `groupC4` (number, default `62`, range 0 to 100); `groupC5` (number, default `65`, range 0 to 100); `groupC6` (number, default `66`, range 0 to 100).

Source: manifest `model-2ea1a60fd78b.js`; view `visualization-a632f07924d8.js` → `AnovaDecompositionVisualization`.

#### Anova interaction plot

Choose an interaction pattern

Type `ANOVA_INTERACTION_PLOT` · manifest v2.

Parameters: `initial_pattern` (enum, default `no-interaction`, one of `no-interaction`, `non-crossover-interaction`, `crossover-interaction`).

Source: manifest `model-485af57b772f.js`; view `visualization-5ada4cea2019.js` → `Visualization`.

#### Antibiotic resistance

Antibiotic resistance stage

Type `ANTIBIOTIC_RESISTANCE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f7d81860699b.js` → `Visualization`.

#### Antibody structure

Type `ANTIBODY_STRUCTURE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-78900d0111bf.js` → `Visualization`.

#### Apoptosis

Initiating signal

Type `APOPTOSIS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-15a122e375b9.js` → `Visualization`.

#### Aquifer and groundwater

Type `AQUIFER_AND_GROUNDWATER`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-8df1526a95b5.js` → `Visualization`.

#### Arc length

Arc-length proof step

Type `ARC_LENGTH`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ad4c108eec43.js` → `ArcLengthVisualization`.

#### Arithmetic mean

Value {number}

Type `ARITHMETIC_MEAN` · manifest v3.

Parameters: `observation1` (integer, default `2`, range 1 to 10); `observation2` (integer, default `4`, range 1 to 10); `observation3` (integer, default `7`, range 1 to 10).

Source: manifest `type-501bb4244183.js`; view `visualization-a8914ccb7d31.js` → `ArithmeticMeanVisualization`.

#### Arithmetic sequence: `a_n = a_1 + (n - 1)d`

Type `ARITHMETIC_SEQUENCE` · manifest v4 · formula `a_n = a_1 + (n - 1)d`.

Parameters: `firstTerm` (integer, default `2`, range -6 to 6); `commonDifference` (integer, default `3`, range -4 to 4); `termNumber` (integer, default `5`, range 1 to 6).

Source: manifest `model-d8a81301bcce.js`; view `visualization-86da777140e9.js` → `ArithmeticSequenceVisualization`.

#### Arithmetic sequence sum formula

Type `ARITHMETIC_SEQUENCE_SUM_FORMULA`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-126a23448330.js` → `ArithmeticSequenceSumVisualization`.

#### Arithmetic vs geometric: `\begin{aligned} a_n &= a_1 + (n - 1)d \\ g_n &= a_1 r^{n - 1} \end{aligned}`

Type `ARITHMETIC_VS_GEOMETRIC` · manifest v3 · formula `\begin{aligned} a_n &= a_1 + (n - 1)d \\ g_n &= a_1 r^{n - 1} \end{aligned}`.

Parameters: `commonDifference` (number, default `2`, range -20 to 20); `commonRatio` (number, default `2`, range -3 to 3).

Source: manifest `model-5dd2c88fcae7.js`; view `visualization-9cc19f33a162.js` → `ArithmeticVsGeometricVisualization`.

#### Aromaticity and huckels rule

Cyclic species

Type `AROMATICITY_AND_HUCKELS_RULE` · manifest v1.

Parameters: `initial_example` (enum, default `benzene`, one of `benzene`, `cyclobutadiene`, `cyclooctatetraene`, `cyclopentadienyl-anion`, `cyclopropenyl-cation`).

Source: manifest `type-4644d5bf838d.js`; view `visualization-b3e514a19067.js` → `Visualization`.

#### Array queue front rear

Queue mode

Type `ARRAY_QUEUE_FRONT_REAR` · manifest v2.

Parameters: `mode` (enum, default `linear`, one of `linear`, `circular`).

Source: manifest `model-9eabfa87d180.js`; view `visualization-259447a84a96.js` → `ArrayQueueFrontRearVisualization`.

#### Asymmetric key roles

Choose the security goal

Type `ASYMMETRIC_KEY_ROLES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e3e9ef3de8ab.js` → `AsymmetricKeyRolesVisualization`.

#### Atherosclerosis

Atherosclerosis stage

Type `ATHEROSCLEROSIS` · manifest v4.

Parameters: `initial_stage` (enum, default `established plaque`, one of `healthy artery`, `fatty streak`, `established plaque`, `plaque rupture and thrombus`).

Source: manifest `type-c62486043386.js`; view `visualization-8ea35fedf34b.js` → `AtherosclerosisVisualization`.

#### Atmospheric layers

Atmospheric temperature profile. At {altitudeCount, plural, one {{altitude} kilometer} other {{altitude} kilometers}}, the selected point is in the {layer}; temperature generally {trend} with further ascent. The nearest boundary is the {boundary} near {boundaryAltitudeCount, plural, one {{boundaryAltitude} kilometer} other {{boundaryAltitude} kilometers}}.

Type `ATMOSPHERIC_LAYERS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2902da3f9f9f.js` → `AtmosphericLayersVisualization`.

#### Atmospheric pollution plume

Atmospheric stability regime

Type `ATMOSPHERIC_POLLUTION_PLUME` · manifest v4.

Parameters: `initial_plume_regime` (enum, default `looping`, one of `looping`, `coning`, `fanning`, `lofting`, `fumigation`, `trapping`).

Source: manifest `type-b367cfc0fc69.js`; view `visualization-4a1d9d6e68e2.js` → `Visualization`.

#### Atomic composition

Type `ATOMIC_COMPOSITION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-da5739819751.js` → `AtomicCompositionVisualization`.

#### Atp cycle

ATP cycle phase

Type `ATP_CYCLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-4b803f605a96.js` → `AtpCycleVisualization`.

#### Autocorrelation

Time-series pattern

Type `AUTOCORRELATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-fdeffcee8eda.js` → `Visualization`.

#### Average speed distance time

Type `AVERAGE_SPEED_DISTANCE_TIME`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-c9b9c630ac1e.js` → `AverageSpeedDistanceTimeVisualization`.

#### Avogadros law: `\frac{V_1}{n_1}=\frac{V_2}{n_2}`

Amount of gas relative to the reference

Type `AVOGADROS_LAW` · manifest v2 · formula `\frac{V_1}{n_1}=\frac{V_2}{n_2}`.

Parameters: `reference_amount_mol` (number, default `1`, range 0.25 to 5); `reference_volume_l` (number, default `22.4`, range 1 to 120).

Source: manifest `model-5a84276bd5aa.js`; view `visualization-921cbc3554bc.js` → `Visualization`.

#### Balancing equations

Coefficient for {formula}

Type `BALANCING_EQUATIONS` · manifest v4.

Parameters: `reaction_example` (enum, default `hydrogen-and-oxygen-to-water`, one of `hydrogen-and-oxygen-to-water`, `nitrogen-and-hydrogen-to-ammonia`, `methane-combustion`).

Source: manifest `type-ee78dd3b1e31.js`; view `visualization-d3a33194e4bc.js` → `BalancingEquationsVisualization`.

#### Bank credit money multiplier: `m = \frac{1}{r}`

Type `BANK_CREDIT_MONEY_MULTIPLIER` · manifest v3 · formula `m = \frac{1}{r}`.

Parameters: `initialDepositUsd` (number, default `1000`, range 100 to 2000); `reserveRatioPercent` (number, default `10`, range 5 to 50).

Source: manifest `model-deaf0a16998f.js`; view `visualization-5c689f680587.js` → `BankCreditMoneyMultiplierVisualization`.

#### Bar magnet field strength

Type `BAR_MAGNET_FIELD_STRENGTH`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b24dfeb4d0f2.js` → `BarMagnetFieldStrengthVisualization`.

#### Bayes theorem

Type `BAYES_THEOREM`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-838d60a9c191.js` → `BayesTheoremVisualization`.

#### Bayesian beta binomial updating

Type `BAYESIAN_BETA_BINOMIAL_UPDATING` · manifest v3.

Parameters: `prior_alpha` (number, default `5`, range 1.5 to 6); `prior_beta` (number, default `5`, range 1.5 to 6); `observed_successes` (integer, default `6`, range 0 to 12); `observed_failures` (integer, default `2`, range 0 to 12).

Source: manifest `model-65899196f0dd.js`; view `visualization-230a0399c81b.js` → `BayesianBetaBinomialVisualization`.

#### Beer lambert law: `A = \varepsilon c l`

Type `BEER_LAMBERT_LAW` · manifest v3 · formula `A = \varepsilon c l`, also `A=\varepsilon l c`, `A = \epsilon c l`, `c = \frac{A}{\varepsilon l}`, `l = \frac{A}{\varepsilon c}`, `\varepsilon = \frac{A}{c l}`.

Parameters: `molarAbsorptivity` (number, default `1.2`, range 0.01 to 100000); `concentration` (number, default `0.8`, range 0.01 to 10); `pathLength` (number, default `1`, range 0.01 to 100).

Source: manifest `type-b34069051dae.js`; view `visualization-77d40e275e37.js` → `BeerLambertLawVisualization`.

#### Beta oxidation cycle

Type `BETA_OXIDATION_CYCLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b11fe2bffc85.js` → `BetaOxidationVisualization`.

#### Bfs dfs traversal

Traversal algorithm

Type `BFS_DFS_TRAVERSAL`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-651eb229f9a7.js` → `Visualization`.

#### Big o growth comparison

Input size n

Type `BIG_O_GROWTH_COMPARISON` · manifest v1.

Parameters: `n` (integer, default `10`, range 1 to 20).

Source: manifest `model-d45c8c7b3dc6.js`; view `visualization-184a6b731381.js` → `BigOGrowthComparisonVisualization`.

#### Big o time complexity

Input size n

Type `BIG_O_TIME_COMPLEXITY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b8722ad2cbd3.js` → `BigOTimeComplexityVisualization`.

#### Binary heap operations

Heap operation

Type `BINARY_HEAP_OPERATIONS` · manifest v2.

Parameters: `heap_kind` (enum, default `min-heap`, one of `min-heap`, `max-heap`); `initial_operation` (enum, default `insert`, one of `insert`, `remove-root`).

Source: manifest `model-775baaf06261.js`; view `visualization-712dd863328e.js` → `BinaryHeapOperationsVisualization`.

#### Binary place value

Decimal value from 0 to 255

Type `BINARY_PLACE_VALUE` · manifest v3.

Parameters: `initial_value` (integer, default `45`, range 0 to 255).

Source: manifest `model-e76cabbd5aab.js`; view `visualization-2dbdc2f0fbb5.js` → `BinaryPlaceValueVisualization`.

#### Binary search

Target value; type an exact value or use the slider

Type `BINARY_SEARCH` · manifest v4.

Parameters: `target` (integer, default `55`, range 10 to 100).

Source: manifest `model-d9cf6b8411c6.js`; view `visualization-143a99541531.js` → `BinarySearchVisualization`.

#### Binary search tree insertion

Insertion order

Type `BINARY_SEARCH_TREE_INSERTION` · manifest v3.

Parameters: `insertionSequence` (enum, default `mixed`, one of `mixed`, `balanced`, `ascending`).

Source: manifest `model-5abcde22832d.js`; view `visualization-9369790be382.js` → `BinarySearchTreeInsertionVisualization`.

#### Binomial distribution

Type `BINOMIAL_DISTRIBUTION` · manifest v6.

Parameters: `trials` (integer, default `6`, range 1 to 10); `successPercent` (number, default `50`, range 0 to 100).

Source: manifest `model-4378a4161730.js`; view `visualization-d9a10690af27.js` → `BinomialDistributionVisualization`.

#### Binomial square

Type `BINOMIAL_SQUARE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-71f69e65c5ef.js` → `BinomialSquareVisualization`.

#### Binomial theorem pascal triangle: `(a+b)^n = \sum_{k=0}^{n}\binom{n}{k}a^{n-k}b^k`

Type `BINOMIAL_THEOREM_PASCAL_TRIANGLE` · manifest v2 · formula `(a+b)^n = \sum_{k=0}^{n}\binom{n}{k}a^{n-k}b^k`.

Parameters: `n` (integer, default `5`, range 0 to 6).

Source: manifest `model-3791234ec878.js`; view `visualization-3834170b3c77.js` → `BinomialTheoremPascalTriangleVisualization`.

#### Biological ph and buffers: `\mathrm{pH}=\mathrm{p}K_a+\log_{10}\!\left(\frac{[A^-]}{[HA]}\right)`

Weak-acid buffer titration curve. At {challenge} buffer equivalents of {direction}, pH is {ph}; H A is {acidPercent} and A minus is {basePercent}. The pKa is {pKa}. {reserve}.

Type `BIOLOGICAL_PH_AND_BUFFERS` · manifest v3 · formula `\mathrm{pH}=\mathrm{p}K_a+\log_{10}\!\left(\frac{[A^-]}{[HA]}\right)`.

Parameters: `pKa` (number, default `7.2`, range 4.5 to 9.5).

Source: manifest `type-9b7b6f94e6e1.js`; view `visualization-292a57058391.js` → `Visualization`.

#### Biomagnification

Food-chain stage

Type `BIOMAGNIFICATION` · manifest v2.

Parameters: `contaminant` (enum, default `DDT`, one of `DDT`, `methylmercury`, `PCBs`).

Source: manifest `model-aae321d23dad.js`; view `visualization-a4854983138c.js` → `Visualization`.

#### Biome climatograph

Biome climatograph with mean annual temperature on the horizontal axis and annual precipitation on the vertical axis. The selected climate is {temperature} degrees Celsius and {precipitation} centimeters per year, {biome}.

Type `BIOME_CLIMATOGRAPH` · manifest v2.

Parameters: `mean_annual_temperature_c` (number, default `18`, range -15 to 30); `annual_precipitation_cm` (number, default `100`, range 0 to 450).

Source: manifest `type-894614f7a446.js`; view `visualization-716f30c38d29.js` → `BiomeClimatographVisualization`.

#### Blockchain hash chain

Type `BLOCKCHAIN_HASH_CHAIN` · manifest v3.

Parameters: `chainState` (enum, default `original`, one of `original`, `tamper_block_1`, `tamper_block_2`, `tamper_block_3`).

Source: manifest `model-c23e01a5b875.js`; view `visualization-73e93f006c6c.js` → `BlockchainHashChainVisualization`.

#### Blood circulation

Type `BLOOD_CIRCULATION` · manifest v3.

Parameters: `circulation` (enum, default `pulmonary`, one of `pulmonary`, `systemic`).

Source: manifest `model-135f4cf52f9c.js`; view `visualization-948650b76e1f.js` → `BloodCirculationVisualization`.

#### Blood glucose regulation

Type `BLOOD_GLUCOSE_REGULATION` · manifest v3.

Parameters: `initial_condition` (enum, default `high`, one of `high`, `low`).

Source: manifest `model-106204ffd60a.js`; view `visualization-3935cb3e044e.js` → `BloodGlucoseVisualization`.

#### Blood pressure regulation

Type `BLOOD_PRESSURE_REGULATION` · manifest v2.

Parameters: `initial_pressure_condition` (enum, default `high`, one of `low`, `normal`, `high`).

Source: manifest `model-e9d53ce0f19d.js`; view `visualization-f05de75b8346.js` → `BloodPressureVisualization`.

#### Blue white screening

Vector state

Type `BLUE_WHITE_SCREENING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b1e941306362.js` → `BlueWhiteScreeningVisualization`.

#### Boiling point elevation: `\Delta T_b=iK_bm`

Solute molality

Type `BOILING_POINT_ELEVATION` · manifest v3 · formula `\Delta T_b=iK_bm`.

Parameters: `solvent` (enum, default `benzene`, one of `water`, `benzene`); `initial_solute_molality` (number, default `0.15`, range 0 to 0.25); `initial_particle_factor` (integer, default `2`, range 1 to 3).

Source: manifest `model-aed74d60f0d7.js`; view `visualization-dc966ec4c303.js` → `BoilingPointElevationVisualization`.

#### Bomb calorimetry

Combustible sample mass

Type `BOMB_CALORIMETRY` · manifest v3.

Parameters: `sample_mass_g` (number, default `1`, range 0.25 to 2); `combustion_energy_kj_per_g` (number, default `24`, range 15 to 35); `calorimeter_heat_capacity_kj_per_k` (number, default `12`, range 8 to 25).

Source: manifest `type-cb7946b61519.js`; view `visualization-8ece82454599.js` → `BombCalorimetryVisualization`.

#### Bond energy curve

Covalent bond order

Type `BOND_ENERGY_CURVE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-1054c5530cad.js` → `BondEnergyCurveVisualization`.

#### Bond polarity: `\Delta \chi = |\chi_2 - \chi_1|`

{atomName} ({symbol}), Pauling electronegativity {electronegativity}

Type `BOND_POLARITY` · manifest v2 · formula `\Delta \chi = |\chi_2 - \chi_1|`.

Parameters: `atom1` (enum, default `H`, one of `H`, `C`, `O`, `F`, `Cl`); `atom2` (enum, default `Cl`, one of `H`, `C`, `O`, `F`, `Cl`).

Source: manifest `model-940064895671.js`; view `visualization-4d543f8c4294.js` → `BondPolarityVisualization`.

#### Boolean logic

Type `BOOLEAN_LOGIC` · manifest v2.

Parameters: `inputA` (boolean, default `true`); `inputB` (boolean, default `false`); `operator` (enum, default `and`, one of `and`, `or`).

Source: manifest `type-8da18ccae221.js`; view `visualization-c0dba6022942.js` → `BooleanLogicVisualization`.

#### Boolean truth table

Type `BOOLEAN_TRUTH_TABLE` · manifest v3.

Parameters: `inputA` (boolean, default `true`); `inputB` (boolean, default `true`); `operator` (enum, default `OR`, one of `AND`, `OR`, `XOR`, `XNOR`).

Source: manifest `model-57f01654f1a3.js`; view `visualization-e6ffa888a6f5.js` → `BooleanTruthTableVisualization`.

#### Bootstrap distribution

Central confidence level

Type `BOOTSTRAP_DISTRIBUTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e4c56b7d7305.js` → `BootstrapDistributionVisualization`.

#### Born haber cycle

Ionic compound

Type `BORN_HABER_CYCLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-9ceff2387be4.js` → `Visualization`.

#### Break even quantity

Type `BREAK_EVEN_QUANTITY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-708fd9b25e1d.js` → `BreakEvenQuantityVisualization`.

#### Breathing mechanics

Breathing phase

Type `BREATHING_MECHANICS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-9182e7407cd6.js` → `Visualization`.

#### Bubble sort

Bubble sort actions

Type `BUBBLE_SORT` · manifest v2.

Parameters: `initialOrder` (enum, default `mixed`, one of `mixed`, `reversed`, `nearly_sorted`, `few_swaps`).

Source: manifest `model-37272c97cf25.js`; view `visualization-d454520778fe.js` → `BubbleSortVisualization`.

#### Buffer composition: `\mathrm{pH}=\mathrm{p}K_a+\log_{10}\!\left(\frac{[A^-]}{[HA]}\right)`

Conjugate-base-to-weak-acid ratio

Type `BUFFER_COMPOSITION` · manifest v4 · formula `\mathrm{pH}=\mathrm{p}K_a+\log_{10}\!\left(\frac{[A^-]}{[HA]}\right)`.

Parameters: `pKa` (number, default `4.76`, range 2 to 12); `baseToAcidRatio` (number, default `1`, range 0.01 to 100).

Source: manifest `type-4aeefa8d363c.js`; view `visualization-fe826e1dec7f.js` → `BufferCompositionVisualization`.

#### Buffer ph strong acid base

Type `BUFFER_PH_STRONG_ACID_BASE` · manifest v4.

Parameters: `netStrongAcidMinusBaseMoles` (number, default `0`, range -0.02 to 0.02).

Source: manifest `model-cf55e77d3f7b.js`; view `visualization-fe0356e6d420.js` → `BufferPhStrongAcidBaseVisualization`.

#### Buoyancy

Type `BUOYANCY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-d2ebb1601423.js` → `BuoyancyVisualization`.

#### Business cycles

Examined time in the business cycle

Type `BUSINESS_CYCLES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ea53e28f7bbd.js` → `BusinessCyclesVisualization`.

#### C array pointer arithmetic

Type `C_ARRAY_POINTER_ARITHMETIC` · manifest v3.

Parameters: `index` (integer, default `3`, range 0 to 7).

Source: manifest `model-d82ec1ece7ce.js`; view `visualization-e413387ea917.js` → `CArrayPointerArithmeticVisualization`.

#### Cadences

Type `CADENCES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-d6df42872f19.js` → `Visualization`.

#### Calcium pth calcitonin feedback

Type `CALCIUM_PTH_CALCITONIN_FEEDBACK` · manifest v4.

Parameters: `calciumCondition` (enum, default `low`, one of `low`, `high`).

Source: manifest `model-ff8cd9e1b433.js`; view `visualization-8e7764c343e4.js` → `CalciumFeedbackVisualization`.

#### Calvin cycle

Calvin-cycle phase

Type `CALVIN_CYCLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-3523899620c2.js` → `CalvinCycleVisualization`.

#### Capillary starling forces: `J_v=K_f[(P_c-P_i)-\sigma(\pi_c-\pi_i)]`

Select a Starling pressure

Type `CAPILLARY_STARLING_FORCES` · manifest v2 · formula `J_v=K_f[(P_c-P_i)-\sigma(\pi_c-\pi_i)]`.

Parameters: `initial_scenario` (enum, default `typical-systemic-capillary`, one of `typical-systemic-capillary`, `raised-capillary-hydrostatic-pressure`, `reduced-plasma-oncotic-pressure`, `raised-interstitial-oncotic-pressure`, `raised-interstitial-hydrostatic-pressure`).

Source: manifest `type-f530fb4543f1.js`; view `visualization-548a624b3138.js` → `CapillaryStarlingVisualization`.

#### Capital flows

Domestic versus foreign real interest rate

Type `CAPITAL_FLOWS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-6ca38e47dbdf.js` → `CapitalFlowsVisualization`.

#### Carbohydrate structure

Type `CARBOHYDRATE_STRUCTURE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-6b9143ae8317.js` → `Visualization`.

#### Carbon cycle

Carbon pathway

Type `CARBON_CYCLE` · manifest v2.

Parameters: `initial_pathway` (enum, default `biological cycle`, one of `biological cycle`, `ocean exchange`, `long-term storage and combustion`).

Source: manifest `model-2389f073136d.js`; view `visualization-13d24c6b327e.js` → `CarbonCycleVisualization`.

#### Carbonyl nucleophilic addition

Carbonyl substrate

Type `CARBONYL_NUCLEOPHILIC_ADDITION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f5edce750aab.js` → `Visualization`.

#### Cardiac action potential

Ventricular action-potential phase

Type `CARDIAC_ACTION_POTENTIAL`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f6c4a695bf70.js` → `CardiacActionPotentialVisualization`.

#### Cardiac cycle

Cardiac-cycle phase

Type `CARDIAC_CYCLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a0ef80677b8c.js` → `Visualization`.

#### Cardiac output product: `CO = HR \times SV`

Cardiac output pulse animation controls

Type `CARDIAC_OUTPUT_PRODUCT` · manifest v5 · formula `CO = HR \times SV`.

Parameters: `heartRateBeatsPerMinute` (number, default `70`, range 40 to 180); `strokeVolumeMilliliters` (number, default `70`, range 30 to 120).

Source: manifest `type-33538976a327.js`; view `visualization-2742502a4673.js` → `CardiacOutputProductVisualization`.

#### Catalyst activation energy

Catalyst effectiveness

Type `CATALYST_ACTIVATION_ENERGY` · manifest v4.

Parameters: `catalystEffectivenessPercent` (number, default `50`, range 0 to 100).

Source: manifest `type-af7f92e44cfd.js`; view `visualization-ee08908ca458.js` → `CatalystActivationEnergyVisualization`.

#### Cathodic protection

Cathodic-protection state

Type `CATHODIC_PROTECTION` · manifest v2.

Parameters: `anode_material` (enum, default `magnesium`, one of `magnesium`, `zinc`).

Source: manifest `model-a538838ccb34.js`; view `visualization-bd9bfa1c4f90.js` → `Visualization`.

#### Cell cycle

Cell-cycle phase

Type `CELL_CYCLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-c8ff78fb8fbb.js` → `CellCycleVisualization`.

#### Cell cycle checkpoints

Checkpoint

Type `CELL_CYCLE_CHECKPOINTS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-127f2ab546ce.js` → `CellCycleCheckpointsVisualization`.

#### Cell junctions

Selected epithelial junction

Type `CELL_JUNCTIONS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ca3ee031a5de.js` → `Visualization`.

#### Cell membrane transport

Transport mechanism

Type `CELL_MEMBRANE_TRANSPORT` · manifest v2.

Parameters: `mechanism` (enum, default `diffusion`, one of `diffusion`, `facilitatedDiffusion`, `activeTransport`).

Source: manifest `model-89c283b46546.js`; view `visualization-268ed5cd2d32.js` → `Visualization`.

#### Cell organelles

Cell type

Type `CELL_ORGANELLES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-34fec9d82613.js` → `Visualization`.

#### Cell signaling pathway

Cell signaling stage

Type `CELL_SIGNALING_PATHWAY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-81758ee1e0c5.js` → `CellSignalingPathwayVisualization`.

#### Cellular respiration inputs outputs

{glucose, plural, one {# glucose molecule} other {# glucose molecules}}

Type `CELLULAR_RESPIRATION_INPUTS_OUTPUTS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-9d6575c08912.js` → `CellularRespirationVisualization`.

#### Central limit theorem

Population shape

Type `CENTRAL_LIMIT_THEOREM` · manifest v4.

Parameters: `population_shape` (enum, default `right-skewed`, one of `right-skewed`, `uniform`, `bimodal`, `normal`); `sample_size` (integer, default `5`, range 1 to 100).

Source: manifest `type-c608c5f26be7.js`; view `visualization-9bc83cca6b03.js` → `CentralLimitTheoremVisualization`.

#### Centripetal force mvr: `F_c = \frac{mv^2}{r}`

Type `CENTRIPETAL_FORCE_MVR` · manifest v2 · formula `F_c = \frac{mv^2}{r}`.

Parameters: `massKilograms` (number, default `2`, range 0.5 to 5); `speedMetersPerSecond` (number, default `4`, range 0 to 8); `radiusMeters` (number, default `2`, range 1 to 5).

Source: manifest `type-3b03c35824de.js`; view `visualization-82e8d61e4847.js` → `CentripetalForceVisualization`.

#### Change of basis: `P_B\mathbf{v}_B=\mathbf{v}`

Type `CHANGE_OF_BASIS` · manifest v1 · formula `P_B\mathbf{v}_B=\mathbf{v}`, also `[\mathbf v]_{\mathrm{std}}=P[\mathbf v]_B`, `[\mathbf v]_B=P^{-1}[\mathbf v]_{\mathrm{std}}`.

Parameters: `vectorX` (number, default `3`, range -5 to 5); `vectorY` (number, default `1`, range -5 to 5); `basis1X` (number, default `1`, range -4 to 4); `basis1Y` (number, default `0`, range -4 to 4); `basis2X` (number, default `0`, range -4 to 4); `basis2Y` (number, default `1`, range -4 to 4).

Source: manifest `model-17f47a9d9054.js`; view `visualization-546ec91821e2.js` → `ChangeOfBasisVisualization`.

#### Charles law: `\frac{V_1}{T_1} = \frac{V_2}{T_2}`

Type `CHARLES_LAW` · manifest v3 · formula `\frac{V_1}{T_1} = \frac{V_2}{T_2}`, also `V_1/T_1 = V_2/T_2`, `v1/t1=v2/t2`, `v2/t2=v1/t1`, `v/t=k`, `k=v/t`, `v=kt`, `kt=v`.

Parameters: `v1` (number, default `12`, range 0.01 to 10000); `t1` (number, default `300`, range 1 to 5000); `v2` (number, default `18`, range 0.01 to 10000); `t2` (number, default `450`, range 1 to 5000); `solveFor` (enum, default `v2`, one of `v1`, `t1`, `v2`, `t2`).

Source: manifest `type-fa03d5dd9600.js`; view `visualization-be1292029263.js` → `CharlesLawVisualization`.

#### Chemiosmosis

Chemiosmosis process stage

Type `CHEMIOSMOSIS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2e98259a992c.js` → `ChemiosmosisVisualization`.

#### Chi square distribution

Degrees of freedom

Type `CHI_SQUARE_DISTRIBUTION` · manifest v3.

Parameters: `degrees_of_freedom` (integer, default `5`, range 1 to 20); `observed_value` (number, default `11.1`, range 0 to 30).

Source: manifest `model-a66b5ddc2f62.js`; view `visualization-d13ee109d047.js` → `ChiSquareDistributionVisualization`.

#### Chi square goodness of fit: `\chi^2 = \sum \frac{(O_i-E_i)^2}{E_i}`

Observed count for category {category}

Type `CHI_SQUARE_GOODNESS_OF_FIT` · manifest v2 · formula `\chi^2 = \sum \frac{(O_i-E_i)^2}{E_i}`.

Parameters: `observedA` (integer, default `18`, range 5 to 60); `observedB` (integer, default `22`, range 5 to 60); `observedC` (integer, default `27`, range 5 to 60); `observedD` (integer, default `33`, range 5 to 60).

Source: manifest `type-f50250083878.js`; view `visualization-313359a48d3f.js` → `ChiSquareGoodnessOfFitVisualization`.

#### Chi square independence

Type `CHI_SQUARE_INDEPENDENCE` · manifest v3.

Parameters: `observedTopLeft` (integer, default `54`, range 20 to 60); `observedTopRight` (integer, default `26`, range 20 to 60); `observedBottomLeft` (integer, default `30`, range 20 to 60); `observedBottomRight` (integer, default `30`, range 20 to 60).

Source: manifest `model-12b1180c259e.js`; view `visualization-5506a278a52b.js` → `ChiSquareIndependenceVisualization`.

#### Chirality and r s configuration

Choose a stereochemistry example

Type `CHIRALITY_AND_R_S_CONFIGURATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b02062db679b.js` → `Visualization`.

#### Chord construction

Type `CHORD_CONSTRUCTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-20b853b1ee68.js` → `Visualization`.

#### Chromatography

Chromatogram development

Type `CHROMATOGRAPHY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-render-b8743cf96d70.js` → `Visualization`.

#### Circle area: `A = \pi r^2`

Type `CIRCLE_AREA` · manifest v3 · formula `A = \pi r^2`, also `A = \frac{\pi d^2}{4}`, `\pi r^2`, `\frac{\pi d^2}{4}`, `pir^2=a`, `pid^2/4=a`.

Parameters: `radius` (number, default `3`, range 0.01 to 10000).

Source: manifest `template-f75272b4eabf.js`; view `visualization-6941902c690d.js` → `CircleAreaVisualization`.

#### Circle circumference: `C = 2\pi r`

Type `CIRCLE_CIRCUMFERENCE` · manifest v5 · formula `C = 2\pi r`, also `2\pi r = C`, `C = \pi d`, `\pi d = C`, `r = \frac{C}{2\pi}`, `d = \frac{C}{\pi}`.

Parameters: `radius` (number, default `3`, range 0.01 to 10000).

Source: manifest `template-d09a2fe7dec8.js`; view `visualization-3a540b78011e.js` → `CircleCircumferenceVisualization`.

#### Classes of levers

Type `CLASSES_OF_LEVERS` · manifest v3.

Parameters: `leverClass` (enum, default `first`, one of `first`, `second`, `third`).

Source: manifest `type-93019a122ac1.js`; view `visualization-5ce7fbc4ba0d.js` → `ClassesOfLeversVisualization`.

#### Classical conditioning

Type `CLASSICAL_CONDITIONING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f3756a6311c6.js` → `ClassicalConditioningVisualization`.

#### Classification threshold

Type `CLASSIFICATION_THRESHOLD` · manifest v5.

Parameters: `threshold` (number, default `0.5`, range 0 to 1).

Source: manifest `type-dca95d451915.js`; view `visualization-fb954a4ac181.js` → `ClassificationThresholdVisualization`.

#### Classification tree

Revealed tree depth

Type `CLASSIFICATION_TREE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-53782f417cb6.js` → `ClassificationTreeVisualization`.

#### Climate feedback loops

Climate mechanism

Type `CLIMATE_FEEDBACK_LOOPS` · manifest v2.

Parameters: `initial_mechanism` (enum, default `ice-albedo`, one of `ice-albedo`, `water-vapor`, `radiative-response`); `initial_change` (enum, default `warming`, one of `warming`, `cooling`).

Source: manifest `type-81172b31949f.js`; view `visualization-f9073948df0c.js` → `ClimateFeedbackLoopsVisualization`.

#### Climate mitigation wedges

{count, plural, =0 {zero wedges} one {one wedge} other {# wedges}}

Type `CLIMATE_MITIGATION_WEDGES` · manifest v3.

Parameters: `required_wedges` (integer, default `7`, range 3 to 12); `horizon_years` (integer, default `50`, range 20 to 100).

Source: manifest `type-6a0aad7ace5c.js`; view `visualization-3cb4f1795d2c.js` → `ClimateMitigationWedgesVisualization`.

#### Clonal selection and immune memory

Clonal-selection stage

Type `CLONAL_SELECTION_AND_IMMUNE_MEMORY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-7f77860d16a8.js` → `ClonalSelectionVisualization`.

#### Co2 and temperature time series

Climate time span

Type `CO2_AND_TEMPERATURE_TIME_SERIES` · manifest v3.

Parameters: `initial_time_span` (enum, default `industrial-era`, one of `industrial-era`, `paleoclimate`).

Source: manifest `model-7fd3bf30713f.js`; view `visualization-633026c1d346.js` → `Visualization`.

#### Coal power plant

Generation stage

Type `COAL_POWER_PLANT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-7e6b0baeda29.js` → `CoalPowerPlantVisualization`.

#### Codon chart

Type `CODON_CHART` · manifest v2.

Parameters: `first_base` (enum, default `A`, one of `U`, `C`, `A`, `G`); `second_base` (enum, default `U`, one of `U`, `C`, `A`, `G`); `third_base` (enum, default `G`, one of `U`, `C`, `A`, `G`).

Source: manifest `model-7fc37b4d721d.js`; view `visualization-8a336b7f7052.js` → `CodonChartVisualization`.

#### Cohens d: `d = \frac{\bar{x}_2 - \bar{x}_1}{s_{\mathrm{pooled}}}`

Signed difference between group 2 and group 1 means

Type `COHENS_D` · manifest v2 · formula `d = \frac{\bar{x}_2 - \bar{x}_1}{s_{\mathrm{pooled}}}`.

Parameters: `initial_mean_difference` (number, default `0.8`, range -4 to 4); `pooled_standard_deviation` (number, default `1`, range 0.75 to 2).

Source: manifest `type-8848a63b92ff.js`; view `visualization-f95a1281a6ea.js` → `CohensDVisualization`.

#### Coin flipping

Type `COIN_FLIPPING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ab8e6e781224.js` → `CoinFlippingVisualization`.

#### Collision orientation

Type `COLLISION_ORIENTATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-618e2b6fc909.js` → `CollisionOrientationVisualization`.

#### Collision simulation: `m_1v_{1,i} + m_2v_{2,i} = m_1v_{1,f} + m_2v_{2,f}`

Type `COLLISION_SIMULATION` · manifest v5 · formula `m_1v_{1,i} + m_2v_{2,i} = m_1v_{1,f} + m_2v_{2,f}`.

Parameters: `cartAInitialVelocityMps` (number, default `2`, range -3 to 3); `cartBInitialVelocityMps` (number, default `-1.5`, range -3 to 3); `collisionType` (enum, default `elastic`, one of `elastic`, `perfectlyInelastic`).

Source: manifest `type-833c7fb020af.js`; view `visualization-cd1cd5eb7e72.js` → `CollisionSimulationVisualization`.

#### Combination formula

Type `COMBINATION_FORMULA` · manifest v4.

Parameters: `n` (integer, default `6`, range 4 to 8); `r` (integer, default `3`, range 2 to 4).

Source: manifest `type-1635fe6bba2b.js`; view `visualization-3aba32098119.js` → `CombinationFormulaVisualization`.

#### Combined gas law

Type `COMBINED_GAS_LAW`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b8ca5bbf9cef.js` → `CombinedGasLawVisualization`.

#### Combining like terms tiles

Example {number}: {expression}

Type `COMBINING_LIKE_TERMS_TILES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b27f7761d51d.js` → `CombiningLikeTermsTilesVisualization`.

#### Common ion effect

Type `COMMON_ION_EFFECT` · manifest v5.

Parameters: `salt_example` (enum, default `AgCl with NaCl`, one of `AgCl with NaCl`, `CaF2 with NaF`, `Mg(OH)2 with KOH`).

Source: manifest `model-e104bfbc6342.js`; view `visualization-f52dcddc8f6e.js` → `CommonIonEffectVisualization`.

#### Common normal intervals

Number of standard deviations from the mean

Type `COMMON_NORMAL_INTERVALS` · manifest v5.

Parameters: `z` (number, default `1`, range 0 to 4).

Source: manifest `model-69143636c0d5.js`; view `visualization-bf42dc5c8dcb.js` → `CommonNormalIntervalsVisualization`.

#### Comparative advantage trade

Producer A capacity allocated to Good X, percent

Type `COMPARATIVE_ADVANTAGE_TRADE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a413338ebfb1.js` → `ComparativeAdvantageTradeVisualization`.

#### Competition and niches

Preferred-resource similarity

Type `COMPETITION_AND_NICHES` · manifest v3.

Parameters: `resource_dimension` (enum, default `food size`, one of `food size`, `habitat space`, `feeding time`).

Source: manifest `model-dc560f6410fb.js`; view `visualization-ef49fdd9ac81.js` → `CompetitionAndNichesVisualization`.

#### Competitive firm loss

Market price

Type `COMPETITIVE_FIRM_LOSS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-4a16e0f402ef.js` → `CompetitiveFirmLossVisualization`.

#### Competitive firm profit

Market price

Type `COMPETITIVE_FIRM_PROFIT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-9028a97273e8.js` → `CompetitiveFirmProfitVisualization`.

#### Competitive labor hiring

Type `COMPETITIVE_LABOR_HIRING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-6c3a91747d8c.js` → `CompetitiveLaborHiringVisualization`.

#### Composite perimeter area

Choose what to measure

Type `COMPOSITE_PERIMETER_AREA` · manifest v1.

Parameters: `lowerWidth` (integer, default `6`, range 4 to 7); `lowerHeight` (integer, default `3`, range 2 to 4); `upperWidth` (integer, default `3`, range 2 to 3); `upperHeight` (integer, default `2`, range 1 to 3); `triangleRun` (integer, default `4`, range 1 to 4); `mode` (enum, default `area`, one of `area`, `perimeter`).

Source: manifest `type-94076f401ee2.js`; view `visualization-2cbb041e5d35.js` → `CompositePerimeterAreaVisualization`.

#### Compound interest

Type `COMPOUND_INTEREST` · manifest v9.

Parameters: `amount` (number, default `1000`, range 0.01 to 1000000000); `ratePercent` (number, default `5`, range 0 to 100); `periods` (integer, default `20`, range 0 to 1000).

Source: manifest `type-ea02b25da175.js`; view `visualization-f4154cc8cc3e.js` → `CompoundInterestVisualization`.

#### Compound pulley mechanical advantage: `\mathrm{IMA}=n`

Type `COMPOUND_PULLEY_MECHANICAL_ADVANTAGE` · manifest v4 · formula `\mathrm{IMA}=n`.

Parameters: `supportSegments` (integer, default `2`, range 2 to 6).

Source: manifest `type-58df9aa6d32b.js`; view `visualization-50ce6f1cf5dd.js` → `CompoundPulleyVisualization`.

#### Compressor curve

Compressor transfer curve with threshold {threshold} decibels, ratio {ratio}, and knee width {knee} decibels. At an input of {input} decibels, output is {output} decibels with {reduction} decibels of gain reduction.

Type `COMPRESSOR_CURVE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-28f4f14eec85.js` → `Visualization`.

#### Concentration cell: `E_{\mathrm{cell}}=\frac{0.0592\,\mathrm{V}}{z}\log_{10}\!\left(\frac{c_{\mathrm{high}}}{c_{\mathrm{low}}}\right)`

Initial concentrated-to-dilute ion concentration ratio

Type `CONCENTRATION_CELL` · manifest v2 · formula `E_{\mathrm{cell}}=\frac{0.0592\,\mathrm{V}}{z}\log_{10}\!\left(\frac{c_{\mathrm{high}}}{c_{\mathrm{low}}}\right)`.

Parameters: `initial_dilute_concentration_molar` (number, default `0.001`, range 0.0001 to 0.001); `initial_concentrated_concentration_molar` (number, default `0.1`, range 0.001 to 0.1); `ion_charge` (integer, default `2`, range 1 to 3).

Source: manifest `type-facf186bb1fa.js`; view `visualization-bcdc6568ab28.js` → `Visualization`.

#### Conditional probability definition

Type `CONDITIONAL_PROBABILITY_DEFINITION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-5e59f446e8ac.js` → `ConditionalProbabilityDefinitionVisualization`.

#### Conductometric titration

Volume of sodium hydroxide added

Type `CONDUCTOMETRIC_TITRATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-87ff3f8aa06f.js` → `Visualization`.

#### Cone surface area: `A = \pi r(r + l)`

Type `CONE_SURFACE_AREA` · manifest v3 · formula `A = \pi r(r + l)`, also `A = \pi r (r + l)`, `A = \pi r^2 + \pi r l`, `A = \pi r l + \pi r^2`, `\pi r (r + l) = A`, `\pi r^2 + \pi r l = A`, `\pi r l + \pi r^2 = A`.

Parameters: `radius` (number, default `3`, range 0.01 to 10000); `slantHeight` (number, default `6`, range 0.01 to 10000).

Source: manifest `type-286f80bf78cd.js`; view `visualization-45c1597df621.js` → `ConeSurfaceAreaVisualization`.

#### Cone volume: `V = \frac{1}{3}\pi r^2 h`

Type `CONE_VOLUME` · manifest v4 · formula `V = \frac{1}{3}\pi r^2 h`, also `V = \frac{1}{3} \pi r^2 h`, `V = \frac{1}{3} \pi h r^2`, `V = \pi r^2 h / 3`, `V = \pi h r^2 / 3`, `\frac{1}{3} \pi r^2 h = V`, `\frac{1}{3} \pi h r^2 = V`, `\pi r^2 h / 3 = V`, `\pi h r^2 / 3 = V`.

Parameters: `radius` (number, default `3`, range 0.01 to 10000); `height` (number, default `8`, range 0.01 to 10000).

Source: manifest `type-92907d86d962.js`; view `visualization-6ef53091ecb9.js` → `ConeVolumeVisualization`.

#### Confidence interval proportion: `\hat p \pm z^*\sqrt{\frac{\hat p(1-\hat p)}{n}}`

Sampling distribution of the observed sample proportion {estimate}. The {confidence} interval for the unknown population proportion runs from {lower} to {upper}, with margin of error {margin}. The central area is {confidence} and each tail is {tail}. {condition}

Type `CONFIDENCE_INTERVAL_PROPORTION` · manifest v4 · formula `\hat p \pm z^*\sqrt{\frac{\hat p(1-\hat p)}{n}}`.

Parameters: `sample_proportion` (number, default `0.4`, range 0.02 to 0.98); `sample_size` (integer, default `100`, range 100 to 400); `confidence_level` (number, default `0.95`, range 0.9 to 0.99).

Source: manifest `type-1e1a69bc5852.js`; view `visualization-4ac7ecb3959b.js` → `Visualization`.

#### Confidence vs prediction bands

Regression plot at x equals {x}, with {count} observed responses. The {level} confidence interval for the mean is {meanLow} to {meanHigh}; the wider {level} prediction interval for one new response is {predictionLow} to {predictionHigh}. Both are centered on the fitted response {mean}.

Type `CONFIDENCE_VS_PREDICTION_BANDS` · manifest v4.

Parameters: `confidence_level` (enum, default `95%`, one of `90%`, `95%`, `99%`).

Source: manifest `model-ceec6b52318c.js`; view `visualization-4874f3152685.js` → `ConfidenceVsPredictionBandsVisualization`.

#### Confusion matrix metrics

Type `CONFUSION_MATRIX_METRICS` · manifest v2.

Parameters: `truePositiveCount` (integer, default `32`, range 0 to 100); `falsePositiveCount` (integer, default `8`, range 0 to 100); `trueNegativeCount` (integer, default `48`, range 0 to 100); `falseNegativeCount` (integer, default `12`, range 0 to 100).

Source: manifest `model-f8363e95e559.js`; view `visualization-548db1929948.js` → `ConfusionMatrixMetricsVisualization`.

#### Conjugated dienes and diels alder

Type `CONJUGATED_DIENES_AND_DIELS_ALDER` · manifest v2.

Parameters: `example` (enum, default `butadiene-and-ethene`, one of `butadiene-and-ethene`, `butadiene-and-methyl-vinyl-ketone`, `butadiene-and-maleic-anhydride`).

Source: manifest `model-456ae69d4c49.js`; view `visualization-dce04aaa04b4.js` → `DielsAlderVisualization`.

#### Consumer and producer surplus

Type `CONSUMER_AND_PRODUCER_SURPLUS` · manifest v4.

Parameters: `demand_shift` (number, default `0`, range -2.5 to 2.5).

Source: manifest `type-1a390930447d.js`; view `visualization-2091bb2f8a39.js` → `Visualization`.

#### Consumer budget line comparative statics: `M = P_x X + P_y Y`

Budget change scenario

Type `CONSUMER_BUDGET_LINE_COMPARATIVE_STATICS` · manifest v4 · formula `M = P_x X + P_y Y`.

Parameters: `changeScenario` (enum, default `income_increase`, one of `income_increase`, `income_decrease`, `price_x_increase`, `price_x_decrease`); `changeMagnitudePercent` (number, default `30`, range 5 to 55).

Source: manifest `model-bbcfc45a37c2.js`; view `visualization-86a310460f58.js` → `ConsumerBudgetLineVisualization`.

#### Context free grammar ambiguity

Type `CONTEXT_FREE_GRAMMAR_AMBIGUITY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-7fc283918a53.js` → `Visualization`.

#### Continuous uniform distribution

Selected interval width as percent of support

Type `CONTINUOUS_UNIFORM_DISTRIBUTION` · manifest v2.

Parameters: `lower_bound` (number, default `0`, range -20 to 10); `upper_bound` (number, default `15`, range 11 to 40).

Source: manifest `type-19d8b437a2d9.js`; view `visualization-127c6b4dcd87.js` → `Visualization`.

#### Contour lines and relief

Route endpoint A. Use arrow keys to move A.

Type `CONTOUR_LINES_AND_RELIEF`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ff393b987bd6.js` → `Visualization`.

#### Coral bleaching

Coral bleaching stage

Type `CORAL_BLEACHING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-1698b1320f0e.js` → `CoralBleachingVisualization`.

#### Corrective policy

Type `CORRECTIVE_POLICY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-3042b4a7840a.js` → `CorrectivePolicyVisualization`.

#### Correlation

Correlation direction

Type `CORRELATION` · manifest v4.

Parameters: `pattern` (enum, default `positive`, one of `negative`, `none`, `positive`).

Source: manifest `model-624ee5d1bac5.js`; view `visualization-42b94835e5d7.js` → `CorrelationVisualization`.

#### Correlation matrix

Variable pair

Type `CORRELATION_MATRIX` · manifest v3.

Parameters: `exampleContext` (enum, default `body-measurements`, one of `body-measurements`, `vehicle-features`, `student-survey`).

Source: manifest `model-60673a8e81e9.js`; view `visualization-b638b3a5fae5.js` → `CorrelationMatrixVisualization`.

#### Cortisol regulation

Type `CORTISOL_REGULATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ee647bbc117d.js` → `CortisolRegulationVisualization`.

#### Coulombs law: `F = k\frac{q_1q_2}{r^2}`

Type `COULOMBS_LAW` · manifest v3 · formula `F = k\frac{q_1q_2}{r^2}`, also `F = k \frac{q_1 q_2}{r^2}`, `F = k_e \frac{q_1 q_2}{r^2}`, `F = \frac{k q_1 q_2}{r^2}`, `E = k\frac{q}{r^2}`, `F = k q_1 q_2 / r^2`, `k q_1 q_2 / r^2 = F`, `r = \sqrt{\frac{k q_1 q_2}{F}}`, `q_1 = \frac{F r^2}{k q_2}`, `q_2 = \frac{F r^2}{k q_1}`, `k = \frac{F r^2}{q_1 q_2}`.

Parameters: `q1` (number, default `3`, range -10000 to 10000); `q2` (number, default `-3`, range -10000 to 10000); `distance` (number, default `4`, range 0.01 to 10000).

Source: manifest `type-98e888d7432f.js`; view `visualization-34d372578e0e.js` → `CoulombsLawVisualization`.

#### Counting sequences

Type `COUNTING_SEQUENCES` · manifest v2.

Parameters: `optionCount` (integer, default `6`, range 4 to 8); `sequenceLength` (integer, default `3`, range 2 to 4); `replacementMode` (enum, default `with`, one of `with`, `without`).

Source: manifest `model-5170f20e545d.js`; view `visualization-be61df1ff1cb.js` → `CountingSequencesVisualization`.

#### Cpu fetch decode execute

Instruction-cycle step

Type `CPU_FETCH_DECODE_EXECUTE` · manifest v2.

Parameters: `instructionExample` (enum, default `load`, one of `load`, `add`, `branch`).

Source: manifest `model-21889c1e147f.js`; view `visualization-debf4847249f.js` → `CpuFetchDecodeExecuteVisualization`.

#### Crispr cas9

Target site

Type `CRISPR_CAS9`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b6e8561a0b76.js` → `Visualization`.

#### Critical angle sine relation: `\sin\theta_c = \frac{n_2}{n_1}`

Type `CRITICAL_ANGLE_SINE_RELATION` · manifest v2 · formula `\sin\theta_c = \frac{n_2}{n_1}`.

Parameters: `indexRatio` (number, default `0.67`, range 0.5 to 0.95).

Source: manifest `type-945e0105df87.js`; view `visualization-87f7e5cbae15.js` → `CriticalAngleSineRelationVisualization`.

#### Critical path network

Activity {task} duration in days

Type `CRITICAL_PATH_NETWORK` · manifest v1.

Parameters: `durationADays` (number, default `3`, range 1 to 10); `durationBDays` (number, default `4`, range 1 to 10); `durationCDays` (number, default `4`, range 1 to 10); `durationDDays` (number, default `3`, range 1 to 10); `durationEDays` (number, default `4`, range 1 to 10); `durationFDays` (number, default `5`, range 1 to 10).

Source: manifest `model-8a2addb2a518.js`; view `visualization-77413c31f81d.js` → `CriticalPathNetworkVisualization`.

#### Cross price elasticity: `E_{xy} = \frac{\%\Delta Q_x}{\%\Delta P_y}`

Product relationship

Type `CROSS_PRICE_ELASTICITY` · manifest v4 · formula `E_{xy} = \frac{\%\Delta Q_x}{\%\Delta P_y}`.

Parameters: `relationship` (enum, default `substitutes`, one of `substitutes`, `complements`); `priceChangeDirection` (enum, default `increase`, one of `increase`, `decrease`); `priceChangeMagnitudePercent` (number, default `30`, range 5 to 60).

Source: manifest `model-71c00d3e4c5e.js`; view `visualization-dcf6669f8199.js` → `CrossPriceElasticityVisualization`.

#### Cross product geometry: `|a\times b|=|a||b|\sin(\theta)`

Type `CROSS_PRODUCT_GEOMETRY` · manifest v1 · formula `|a\times b|=|a||b|\sin(\theta)`, also `\|\vec a\times\vec b\|=\|\vec a\|\|\vec b\|\sin(\theta)`, `\vec a\times\vec b`, `\vec b\times\vec a=-(\vec a\times\vec b)`, `\|\vec a\times\vec b\|=\text{parallelogram area}`.

Parameters: `magnitudeA` (number, default `3`, range 0.5 to 6); `magnitudeB` (number, default `2.5`, range 0.5 to 6); `angleDeg` (number, default `60`, range 5 to 175); `order` (enum, default `axb`, one of `axb`, `bxa`).

Source: manifest `type-25a004ce6551.js`; view `visualization-cbf19009f5db.js` → `CrossProductGeometryVisualization`.

#### Crossing over

Crossing over stage

Type `CROSSING_OVER`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-8313295139c3.js` → `CrossingOverVisualization`.

#### Crowding out

Type `CROWDING_OUT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-4103e4274d91.js` → `Visualization`.

#### Crystal unit cells

Cubic unit-cell type

Type `CRYSTAL_UNIT_CELLS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-5caad02b2bb5.js` → `Visualization`.

#### Currency appreciation

Type `CURRENCY_APPRECIATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-26a652ba6075.js` → `CurrencyAppreciationVisualization`.

#### Current to magnetic field: `B = \frac{\mu_0 I}{2\pi r}`

Direction of current through the wire

Type `CURRENT_TO_MAGNETIC_FIELD` · manifest v3 · formula `B = \frac{\mu_0 I}{2\pi r}`.

Parameters: `currentDirection` (enum, default `up`, one of `up`, `down`); `currentStrengthAmperes` (number, default `5`, range 1 to 10).

Source: manifest `model-b39b238c2140.js`; view `visualization-a38bfbc7ce44.js` → `CurrentToMagneticFieldVisualization`.

#### Current to magnetic field direction

Conventional current upward

Type `CURRENT_TO_MAGNETIC_FIELD_DIRECTION` · manifest v1.

Parameters: `currentDirection` (enum, default `up`, one of `up`, `down`).

Source: manifest `type-8ea75e03943c.js`; view `visualization-42e5c786ddff.js` → `CurrentToMagneticFieldDirectionVisualization`.

#### Cyclohexane chair flips

Substituted cyclohexane example

Type `CYCLOHEXANE_CHAIR_FLIPS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-d166567b9d7f.js` → `Visualization`.

#### Cylinder volume: `V = \pi r^2 h`

Type `CYLINDER_VOLUME` · manifest v3 · formula `V = \pi r^2 h`, also `V = \pi h r^2`, `\pi r^2 h = V`, `\pi h r^2 = V`, `h = \frac{V}{\pi r^2}`, `r^2 = \frac{V}{\pi h}`.

Parameters: `radius` (number, default `3`, range 0.01 to 10000); `height` (number, default `8`, range 0.01 to 10000).

Source: manifest `type-e93330f8f338.js`; view `visualization-81977f42d8c7.js` → `CylinderVolumeVisualization`.

#### Dc circuit power: `P = VI`

Type `DC_CIRCUIT_POWER` · manifest v4 · formula `P = VI`.

Parameters: `voltageVolts` (number, default `12`, range 1 to 24); `resistanceOhms` (number, default `6`, range 1 to 24).

Source: manifest `type-81adbb1f028d.js`; view `visualization-a2163db9628f.js` → `DcCircuitPowerVisualization`.

#### Decibel safety

Type `DECIBEL_SAFETY` · manifest v4.

Parameters: `sound_level_dba` (number, default `85`, range 82 to 100); `exposure_duration_minutes` (integer, default `480`, range 0 to 960).

Source: manifest `type-b72953d55796.js`; view `visualization-ce3309b69962.js` → `Visualization`.

#### Decision tree classification path

Type `DECISION_TREE_CLASSIFICATION_PATH` · manifest v3.

Parameters: `x1` (number, default `5.5`, range 0 to 10); `x2` (number, default `3.5`, range 0 to 10).

Source: manifest `model-23fec778784f.js`; view `visualization-4a84ea0a81e7.js` → `DecisionTreeClassificationPathVisualization`.

#### Degree of unsaturation

Type `DEGREE_OF_UNSATURATION` · manifest v2.

Parameters: `example_formula` (enum, default `C6H10`, one of `C2H6`, `C4H8`, `C6H10`, `C6H6`, `C4H6Br2`, `C5H8O`, `C5H9N`).

Source: manifest `type-60f4e9362b4d.js`; view `visualization-2659fbc95e4b.js` → `DegreeOfUnsaturationVisualization`.

#### Dehydration synthesis vs hydrolysis

Reaction direction

Type `DEHYDRATION_SYNTHESIS_VS_HYDROLYSIS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-d6b0d33a445f.js` → `Visualization`.

#### Delta g k e relationship

Type `DELTA_G_K_E_RELATIONSHIP` · manifest v4.

Parameters: `standard_cell_potential_volts` (number, default `0.12`, range -0.3 to 0.3); `electrons_transferred` (integer, default `2`, range 1 to 6); `temperature_kelvin` (number, default `298.15`, range 250 to 400).

Source: manifest `model-873e0c320c3b.js`; view `visualization-468111ed8a31.js` → `DeltaGKERelationshipVisualization`.

#### Demand curve

Type `DEMAND_CURVE` · manifest v3.

Parameters: `price` (number, default `5`, range 1 to 9); `demand_shift` (number, default `0`, range -1 to 1).

Source: manifest `type-759e4fab0713.js`; view `visualization-f21684fae5ec.js` → `Visualization`.

#### Demand elasticity

Demand responsiveness

Type `DEMAND_ELASTICITY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-8f620b64d619.js` → `Visualization`.

#### Demand shock

Type `DEMAND_SHOCK`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-75c5e0d201e0.js` → `DemandShockVisualization`.

#### Denial of service overload

Request flow animation

Type `DENIAL_OF_SERVICE_OVERLOAD` · manifest v5.

Parameters: `server_capacity` (integer, default `120`, range 100 to 300); `legitimate_request_rate` (integer, default `40`, range 10 to 80).

Source: manifest `type-253ef788d0bb.js`; view `visualization-f7666872daea.js` → `Visualization`.

#### Density dependence

Current population density index

Type `DENSITY_DEPENDENCE` · manifest v2.

Parameters: `carrying_capacity` (integer, default `100`, range 40 to 200); `intrinsic_growth_rate` (number, default `0.4`, range 0.1 to 0.8).

Source: manifest `model-43a9f02da387.js`; view `visualization-592ad0110941.js` → `DensityDependenceVisualization`.

#### Derivative

Type `DERIVATIVE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-68b33db59556.js` → `DerivativeVisualization`.

#### Derivative as secant: `f'(a)=\lim_{h\to0^+}\frac{f(a+h)-f(a)}{h}`

Positive horizontal change h from P to Q

Type `DERIVATIVE_AS_SECANT` · manifest v3 · formula `f'(a)=\lim_{h\to0^+}\frac{f(a+h)-f(a)}{h}`.

Parameters: `functionExpression` (enum, default `x^2`, one of `x^2`, `x^3`, `x^3-x`, `sin(x)`, `cos(x)`, `e^x`); `xValue` (number, default `1`, range -10 to 10); `h` (number, default `2`, range 0.05 to 4).

Source: manifest `type-b5036e205e38.js`; view `visualization-ea8859292d66.js` → `DerivativeAsSecantVisualization`.

#### Derivative product rule: `(fg)' = f'g + fg'`

Type `DERIVATIVE_PRODUCT_RULE` · manifest v2 · formula `(fg)' = f'g + fg'`.

Parameters: `deltaX` (number, default `2`, range 0.05 to 2).

Source: manifest `type-3f3e34153e7c.js`; view `visualization-fb7a08b38874.js` → `DerivativeProductRuleVisualization`.

#### Detergent micelle grease

Relative detergent amount

Type `DETERGENT_MICELLE_GREASE` · manifest v4.

Parameters: `relativeDetergentAmountPercent` (number, default `40`, range 0 to 100).

Source: manifest `model-94e102697f8c.js`; view `visualization-2e6aad2a5b13.js` → `DetergentMicelleGreaseVisualization`.

#### Dice rolling

Type `DICE_ROLLING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-4c72e3abeeb9.js` → `DiceRollingVisualization`.

#### Dichotomous key

Type `DICHOTOMOUS_KEY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2964cb9ce568.js` → `DichotomousKeyVisualization`.

#### Difference in differences: `\widehat{\tau}_{DiD} = \Delta Y_T - \Delta Y_C`

Type `DIFFERENCE_IN_DIFFERENCES` · manifest v3 · formula `\widehat{\tau}_{DiD} = \Delta Y_T - \Delta Y_C`.

Parameters: `treated_pre_outcome` (number, default `60`, range 20 to 80); `control_pre_outcome` (number, default `40`, range 20 to 80); `common_change` (number, default `8`, range -15 to 15); `treatment_effect` (number, default `14`, range -20 to 20).

Source: manifest `type-62bcf9304582.js`; view `visualization-cb4b4f877893.js` → `Visualization`.

#### Difference of squares

Type `DIFFERENCE_OF_SQUARES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-9ed4b9e91421.js` → `DifferenceOfSquaresVisualization`.

#### Diffusion

Type `DIFFUSION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-3ae9544808b0.js` → `DiffusionVisualization`.

#### Digestive tract absorption

Nutrient to trace

Type `DIGESTIVE_TRACT_ABSORPTION` · manifest v2.

Parameters: `nutrient` (enum, default `carbohydrate`, one of `carbohydrate`, `protein`, `long-chain fat`).

Source: manifest `model-7f8b73e7da12.js`; view `visualization-5574143ffb81.js` → `DigestiveTractAbsorptionVisualization`.

#### Dijkstra shortest path

Type `DIJKSTRA_SHORTEST_PATH`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a24bf7596d02.js` → `DijkstraShortestPathVisualization`.

#### Diminishing marginal returns

Type `DIMINISHING_MARGINAL_RETURNS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-d902d84006c8.js` → `MarginalProductVisualization`.

#### Diminishing marginal utility

Marginal and total utility graph. {quantity, plural, =0 {No units are selected} one {Unit 1 contributes {marginal, number} utility} other {Unit {quantity, number} contributes {marginal, number} utility}}; total utility is {total, number}. Marginal utility falls with each unit, while total utility rises more slowly, levels off, and eventually falls.

Type `DIMINISHING_MARGINAL_UTILITY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-df388f26f526.js` → `Visualization`.

#### Direct inverse proportion

Type `DIRECT_INVERSE_PROPORTION` · manifest v4.

Parameters: `x` (number, default `1`, range 0.5 to 2.5).

Source: manifest `type-bd43c0bf82aa.js`; view `visualization-99c59e9046d3.js` → `DirectInverseProportionVisualization`.

#### Discrete event queue simulation

Arrival pattern

Type `DISCRETE_EVENT_QUEUE_SIMULATION` · manifest v4.

Parameters: `workload` (enum, default `bursty`, one of `spaced`, `bursty`).

Source: manifest `type-178545bdd851.js`; view `visualization-2e7ddfcf2d7a.js` → `DiscreteEventQueueSimulationVisualization`.

#### Discriminant

Type `DISCRIMINANT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-c355fb7c9a7b.js` → `DiscriminantVisualization`.

#### Dissolution

Dissolution stage

Type `DISSOLUTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-72aae2c4a4e9.js` → `Visualization`.

#### Distance formula

Type `DISTANCE_FORMULA`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2ca587b1743a.js` → `DistanceFormulaVisualization`.

#### Distance traveled vs displacement

Type `DISTANCE_TRAVELED_VS_DISPLACEMENT` · manifest v2.

Parameters: `route` (enum, default `detour`, one of `direct`, `detour`, `round_trip`).

Source: manifest `model-3fc8a8edee3e.js`; view `visualization-eb0ada7f1faf.js` → `DistanceTraveledVsDisplacementVisualization`.

#### Distillation

Distillation stage

Type `DISTILLATION` · manifest v5.

Parameters: `mixture_example` (enum, default `salt water`, one of `salt water`, `colored solution`, `widely separated liquids`).

Source: manifest `model-a11bd7ff405e.js`; view `visualization-9f083de0743e.js` → `DistillationVisualization`.

#### Distributive property: `a(b+c)=ab+ac`

Type `DISTRIBUTIVE_PROPERTY` · manifest v2 · formula `a(b+c)=ab+ac`.

Parameters: `a` (integer, default `8`, range 2 to 8); `b` (integer, default `7`, range 2 to 8); `c` (integer, default `7`, range 2 to 8).

Source: manifest `type-50c9fc73ec1d.js`; view `visualization-27a3025ced7b.js` → `DistributivePropertyVisualization`.

#### Divide conquer recurrence tree

Choose recurrence example

Type `DIVIDE_CONQUER_RECURRENCE_TREE` · manifest v1.

Parameters: `recurrence_example` (enum, default `T(n) = 2T(n/2) + n`, one of `T(n) = 2T(n/2) + 1`, `T(n) = 2T(n/2) + n`, `T(n) = 2T(n/2) + n^2`).

Source: manifest `type-603f86db5a64.js`; view `visualization-8eacfd469593.js` → `DivideConquerRecurrenceTreeVisualization`.

#### Dna gel fragment migration

Type `DNA_GEL_FRAGMENT_MIGRATION` · manifest v2.

Parameters: `runTimeMinutes` (integer, default `18`, range 1 to 40); `fragmentSizeBasePairs` (integer, default `700`, range 100 to 2000).

Source: manifest `type-72629e85a720.js`; view `visualization-fc8165cc4da4.js` → `DnaGelFragmentMigrationVisualization`.

#### Dna replication fork

Type `DNA_REPLICATION_FORK`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-5878bdaacaac.js` → `DnaReplicationForkVisualization`.

#### Dna transcription

Type `DNA_TRANSCRIPTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-9c5742fe4c07.js` → `DnaTranscriptionVisualization`.

#### Dns resolution

Cache miss: follow the nameserver hierarchy

Type `DNS_RESOLUTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a808d4d9ca24.js` → `DnsResolutionVisualization`.

#### Doppler effect

Type `DOPPLER_EFFECT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-342e1d051cd9.js` → `DopplerEffectVisualization`.

#### Dose response curve

Potency shift: same efficacy, different potency

Type `DOSE_RESPONSE_CURVE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-62c4a1de70d9.js` → `DoseResponseVisualization`.

#### Dot plot

Data set

Type `DOT_PLOT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f9f2735528c0.js` → `DotPlotVisualization`.

#### Double entry transaction effects

Type `DOUBLE_ENTRY_TRANSACTION_EFFECTS` · manifest v3.

Parameters: `transaction_type` (enum, default `owner investment for cash`, one of `owner investment for cash`, `equipment purchase for cash`, `supplies purchase on account`, `payment of accounts payable`).

Source: manifest `model-2922d86b57c4.js`; view `visualization-a02a73f05ad6.js` → `DoubleEntryTransactionEffectsVisualization`.

#### Double fertilization

Double-fertilization stage

Type `DOUBLE_FERTILIZATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-7de455db3ce0.js` → `Visualization`.

#### Drum grid notation

Choose eighth-note or sixteenth-note subdivision

Type `DRUM_GRID_NOTATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-9cf833447594.js` → `DrumGridNotationVisualization`.

#### Dynamic equilibrium

Reactant-rich start

Type `DYNAMIC_EQUILIBRIUM`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a4e2f2952de1.js` → `Visualization`.

#### Dynamics and articulation

Type `DYNAMICS_AND_ARTICULATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-fba275eb9472.js` → `Visualization`.

#### Earth layers and convection

Mantle-convection stage

Type `EARTH_LAYERS_AND_CONVECTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-d3c9307203ec.js` → `Visualization`.

#### Ecological footprint

Type `ECOLOGICAL_FOOTPRINT` · manifest v5.

Parameters: `focus_year` (integer, default `2014`, range 1961 to 2014).

Source: manifest `type-e177a5957273.js`; view `visualization-11502f5b0b86.js` → `EcologicalFootprintVisualization`.

#### Ecological succession stages

Stage {number, number}: {stage}

Type `ECOLOGICAL_SUCCESSION_STAGES` · manifest v2.

Parameters: `successionType` (enum, default `primary`, one of `primary`, `secondary`).

Source: manifest `model-f721c5cf751c.js`; view `visualization-86d5b2b9641c.js` → `EcologicalSuccessionVisualization`.

#### Ecological tolerance curve

Relative {factor} condition from low to high

Type `ECOLOGICAL_TOLERANCE_CURVE` · manifest v3.

Parameters: `environmental_factor` (enum, default `temperature`, one of `temperature`, `salinity`, `pH`, `dissolved oxygen`, `moisture`).

Source: manifest `model-d1b5eccccd13.js`; view `visualization-3cb74d796623.js` → `EcologicalToleranceCurveVisualization`.

#### Economic externalities

Type `ECONOMIC_EXTERNALITIES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-5bf979c2c415.js` → `NegativeExternalityVisualization`.

#### Economic order quantity

Type `ECONOMIC_ORDER_QUANTITY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-7a187cd51899.js` → `EconomicOrderQuantityVisualization`.

#### Economies of scale

Type `ECONOMIES_OF_SCALE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-1dd88eb065df.js` → `LongRunAtcVisualization`.

#### Eigendirections: `A\mathbf{v}=\lambda\mathbf{v}`

Type `EIGENDIRECTIONS` · manifest v3 · formula `A\mathbf{v}=\lambda\mathbf{v}`.

Parameters: `a11` (number, default `2`, range -2 to 2); `a12` (number, default `1`, range -2 to 2); `a21` (number, default `1`, range -2 to 2); `a22` (number, default `2`, range -2 to 2).

Source: manifest `type-9dd1c641b080.js`; view `visualization-fa0d38568aed.js` → `EigendirectionsVisualization`.

#### Ekg parts

Type `EKG_PARTS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-6285f6c185ee.js` → `EkgPartsVisualization`.

#### El nino and la nina

Type `EL_NINO_AND_LA_NINA` · manifest v2.

Parameters: `initial_phase` (enum, default `Neutral`, one of `La Niña`, `Neutral`, `El Niño`).

Source: manifest `type-44fc1ec684df.js`; view `visualization-d8634348de5d.js` → `ElNinoAndLaNinaVisualization`.

#### Elasticity total revenue

Price

Type `ELASTICITY_TOTAL_REVENUE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-4a0f2b5c3e7f.js` → `ElasticityTotalRevenueVisualization`.

#### Electric current charge flow: `I = \frac{Q}{t}`

Type `ELECTRIC_CURRENT_CHARGE_FLOW` · manifest v3 · formula `I = \frac{Q}{t}`.

Parameters: `packetRatePerSecond` (number, default `4`, range 1 to 8); `chargePerPacketCoulombs` (number, default `1`, range 0.5 to 3).

Source: manifest `type-dcb1b5569c53.js`; view `visualization-b5998cf24f93.js` → `ElectricCurrentChargeFlowVisualization`.

#### Electric field: `E\propto\frac{1}{r^2}`

Type `ELECTRIC_FIELD` · manifest v3 · formula `E\propto\frac{1}{r^2}`.

Parameters: `polarity` (enum, default `positive`, one of `positive`, `negative`).

Source: manifest `model-51dd0b398611.js`; view `visualization-af41454fc8db.js` → `ElectricFieldVisualization`.

#### Electric field multiple charges

Type `ELECTRIC_FIELD_MULTIPLE_CHARGES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-206d7c7957c3.js` → `ElectricFieldMultipleChargesVisualization`.

#### Electric flux flat surface: `\Phi_E = EA\cos(\theta)`

Electric field magnitude

Type `ELECTRIC_FLUX_FLAT_SURFACE` · manifest v2 · formula `\Phi_E = EA\cos(\theta)`.

Parameters: `fieldStrengthNewtonsPerCoulomb` (number, default `6`, range 0 to 10); `areaSquareMeters` (number, default `3`, range 0.5 to 5); `angleDegrees` (number, default `30`, range 0 to 90).

Source: manifest `type-8d1ac0d714c4.js`; view `visualization-732d83b5c9e5.js` → `ElectricFluxFlatSurfaceVisualization`.

#### Electrical resistance factors

Type `ELECTRICAL_RESISTANCE_FACTORS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-386a4b4b56a9.js` → `ElectricalResistanceFactorsVisualization`.

#### Electrolyte conductivity

{solution}, {strength}

Type `ELECTROLYTE_CONDUCTIVITY` · manifest v3.

Parameters: `initial_solution` (enum, default `potassium-chloride`, one of `potassium-chloride`, `acetic-acid`, `ethanol`); `initial_concentration` (number, default `0.6`, range 0.1 to 1).

Source: manifest `type-ba543fe66918.js`; view `visualization-a12eb08ccb6f.js` → `ElectrolyteConductivityVisualization`.

#### Electrolytic cell

Type `ELECTROLYTIC_CELL` · manifest v2.

Parameters: `electrolyte` (enum, default `molten sodium chloride`, one of `molten sodium chloride`, `molten lead(II) bromide`).

Source: manifest `model-ffbb570f1ec8.js`; view `visualization-ada7a23666ca.js` → `Visualization`.

#### Electromagnetic spectrum

Electromagnetic band

Type `ELECTROMAGNETIC_SPECTRUM` · manifest v1.

Parameters: `focus_band` (enum, default `visible`, one of `radio`, `microwave`, `infrared`, `visible`, `ultraviolet`, `x-ray`, `gamma-ray`).

Source: manifest `model-e044398b5fd7.js`; view `visualization-ff7155a8e1f9.js` → `ElectromagneticSpectrumVisualization`.

#### Electron orbital filling

Type `ELECTRON_ORBITAL_FILLING` · manifest v3.

Parameters: `atomicNumber` (integer, default `10`, range 1 to 36).

Source: manifest `model-b586e91ccccc.js`; view `visualization-5dfbdcd33ef6.js` → `ElectronOrbitalFillingVisualization`.

#### Element vs compound vs mixture

Particle sample

Type `ELEMENT_VS_COMPOUND_VS_MIXTURE` · manifest v2.

Parameters: `initial_sample` (enum, default `monatomic element`, one of `monatomic element`, `diatomic element`, `molecular compound`, `mixture of elements`, `mixture of element and compound`, `mixture of compounds`).

Source: manifest `type-ea91da6d3b05.js`; view `visualization-d9cf800f090c.js` → `Visualization`.

#### Elementary row operations: `\left[A\mid\mathbf{b}\right]\sim\left[I\mid\mathbf{x}\right]`

Gaussian elimination step

Type `ELEMENTARY_ROW_OPERATIONS` · manifest v1 · formula `\left[A\mid\mathbf{b}\right]\sim\left[I\mid\mathbf{x}\right]`.

Parameters: `solutionX` (number, default `1`, range -2 to 2); `solutionY` (number, default `2`, range -2 to 2).

Source: manifest `model-41a7cd3908a8.js`; view `visualization-a90782b34700.js` → `ElementaryRowOperationsVisualization`.

#### Empirical rule

Within {count, plural, one {# standard deviation} other {# standard deviations}}

Type `EMPIRICAL_RULE` · manifest v4.

Parameters: `mean` (number, default `100`, range -10000 to 10000); `standard_deviation` (number, default `15`, range 0.1 to 3000).

Source: manifest `model-8bc3f47e8528.js`; view `visualization-2f2dae37e1f5.js` → `EmpiricalRuleVisualization`.

#### Empirical vs molecular formula

Type `EMPIRICAL_VS_MOLECULAR_FORMULA`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-aa28f2fa08f6.js` → `Visualization`.

#### Endocrine feedback axis

Peripheral-hormone state

Type `ENDOCRINE_FEEDBACK_AXIS` · manifest v3.

Parameters: `axis` (enum, default `thyroid`, one of `thyroid`, `adrenal`).

Source: manifest `model-5a5542c48ccf.js`; view `visualization-f9a8719cc505.js` → `Visualization`.

#### Endocytosis and exocytosis

Transport stage

Type `ENDOCYTOSIS_AND_EXOCYTOSIS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-4a5b5bc2a36d.js` → `Visualization`.

#### Endomembrane pathway

Cargo destination

Type `ENDOMEMBRANE_PATHWAY` · manifest v2.

Parameters: `cargo_destination` (enum, default `secretion`, one of `secretion`, `plasma membrane`, `lysosome`).

Source: manifest `model-6d0fe1644e34.js`; view `visualization-b5b3e1066992.js` → `Visualization`.

#### Energy coupling

ATP cycle path

Type `ENERGY_COUPLING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-af8c92ab3171.js` → `EnergyCouplingVisualization`.

#### Energy efficiency sankey diagram: `\text{Efficiency}=\frac{\text{useful output}}{\text{total input}}`

Change the percentage of input energy transferred usefully

Type `ENERGY_EFFICIENCY_SANKEY_DIAGRAM` · manifest v2 · formula `\text{Efficiency}=\frac{\text{useful output}}{\text{total input}}`.

Parameters: `energy_system` (enum, default `light bulb`, one of `light bulb`, `electric motor`, `car engine`); `input_energy_joules` (number, default `100`, range 1 to 10000); `initial_efficiency_percent` (number, default `40`, range 0 to 100).

Source: manifest `type-c20db913b337.js`; view `visualization-5fce99ac71f0.js` → `EnergyEfficiencySankeyVisualization`.

#### Enthalpy: `\Delta H = H_{\mathrm{products}} - H_{\mathrm{reactants}}`

Type `ENTHALPY` · manifest v4 · formula `\Delta H = H_{\mathrm{products}} - H_{\mathrm{reactants}}`.

Parameters: `enthalpyChangeKilojoules` (number, default `-50`, range -100 to 100).

Source: manifest `model-c5cda5a90fb9.js`; view `visualization-de5a9eee6205.js` → `EnthalpyVisualization`.

#### Entropy and dispersal

Type `ENTROPY_AND_DISPERSAL`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-995363862b08.js` → `Visualization`.

#### Enzyme and temperature

Type `ENZYME_AND_TEMPERATURE` · manifest v4.

Parameters: `temperatureCelsius` (number, default `25`, range 0 to 70).

Source: manifest `model-f5d8a0ad0545.js`; view `visualization-9ae1bd93c965.js` → `EnzymeAndTemperatureVisualization`.

#### Enzyme inhibition rate effects

Relative substrate concentration

Type `ENZYME_INHIBITION_RATE_EFFECTS` · manifest v4.

Parameters: `relativeSubstrateConcentration` (number, default `2`, range 0 to 10); `inhibitorLevel` (enum, default `low`, one of `none`, `low`, `high`).

Source: manifest `model-7ecafb9fbe11.js`; view `visualization-6bac77b5a01c.js` → `EnzymeInhibitionRateEffectsVisualization`.

#### Enzyme lock key cycle

Type `ENZYME_LOCK_KEY_CYCLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-590c3a9ebbfe.js` → `EnzymeLockKeyCycleVisualization`.

#### Epigenetics

Chromatin state

Type `EPIGENETICS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-43b7e917fba9.js` → `Visualization`.

#### Epsp ipsp summation

Type `EPSP_IPSP_SUMMATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-499703ac7d49.js` → `EpspIpspSummationVisualization`.

#### Eq curve

Center frequency in hertz

Type `EQ_CURVE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-cee0ca565a94.js` → `Visualization`.

#### Equilateral triangle

Type `EQUILATERAL_TRIANGLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-78185eaf9f63.js` → `EquilateralTriangleVisualization`.

#### Equilibrium concentration graph

Species added at equilibrium

Type `EQUILIBRIUM_CONCENTRATION_GRAPH` · manifest v3.

Parameters: `equilibrium_constant` (number, default `2`, range 0.25 to 4); `initial_total_concentration` (number, default `1`, range 0.5 to 2).

Source: manifest `model-0b71968a76c7.js`; view `visualization-5b58cf8890d3.js` → `EquilibriumConcentrationVisualization`.

#### Er diagram relational tables

ER mapping stage

Type `ER_DIAGRAM_RELATIONAL_TABLES` · manifest v2.

Parameters: `relationship_kind` (enum, default `one-to-many`, one of `one-to-one`, `one-to-many`, `many-to-many`); `include_relationship_attribute` (boolean, default `true`).

Source: manifest `model-b729a24f3575.js`; view `visualization-8ca584d2b229.js` → `ErDiagramVisualization`.

#### Eukaryotic gene regulation

Chromatin accessibility

Type `EUKARYOTIC_GENE_REGULATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-86e9a3b6e7a6.js` → `Visualization`.

#### Euler formula

Type `EULER_FORMULA`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ada72916a09d.js` → `EulerFormulaVisualization`.

#### Eutrophication

Type `EUTROPHICATION` · manifest v2.

Parameters: `waterBody` (enum, default `freshwater lake`, one of `freshwater lake`, `estuary`, `coastal bay`).

Source: manifest `model-6d7b03cccde0.js`; view `visualization-99356747691d.js` → `EutrophicationVisualization`.

#### Evaporation rate factors

Particle attraction strength

Type `EVAPORATION_RATE_FACTORS` · manifest v1.

Parameters: `temperatureCelsius` (number, default `25`, range 10 to 60); `surfaceAreaPercent` (number, default `60`, range 25 to 100); `airflowMetersPerSecond` (number, default `1`, range 0 to 3); `humidityPercent` (number, default `40`, range 0 to 100); `attraction` (enum, default `medium`, one of `weak`, `medium`, `strong`).

Source: manifest `type-119bdab76cbe.js`; view `visualization-6ceeae4550dd.js` → `EvaporationRateFactorsVisualization`.

#### Even odd function symmetry

Type `EVEN_ODD_FUNCTION_SYMMETRY` · manifest v3.

Parameters: `symmetryType` (enum, default `even`, one of `even`, `odd`, `neither`); `x` (number, default `3`, range 1.25 to 4.5).

Source: manifest `model-4d3238eeddf7.js`; view `visualization-69926e78bb76.js` → `EvenOddFunctionSymmetryVisualization`.

#### Expected value weighted average

Type `EXPECTED_VALUE_WEIGHTED_AVERAGE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-4d01df2715e3.js` → `ExpectedValueWeightedAverageVisualization`.

#### Exponent laws repeated multiplication

Type `EXPONENT_LAWS_REPEATED_MULTIPLICATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e060561fe0c0.js` → `ExponentLawsRepeatedMultiplicationVisualization`.

#### Exponential decay: `y = e^{-kt}`

Type `EXPONENTIAL_DECAY` · manifest v4 · formula `y = e^{-kt}`, also `y = y_0 \exp(-kt)`, `y = e^{-t}`, `y = 2e^{-0.5t}`, `N = N_0 e^{-\lambda t}`, `A = A_0 e^{-\lambda t}`.

Parameters: `initial` (number, default `6`, range 0.01 to 10000); `decay` (number, default `0.6`, range 0.01 to 10000).

Source: manifest `type-33f0d487d38b.js`; view `visualization-874bcb9fbee2.js` → `ExponentialDecayVisualization`.

#### Exponential distribution: `f(t)=\lambda e^{-\lambda t},\quad t\ge 0`

Constant event rate

Type `EXPONENTIAL_DISTRIBUTION` · manifest v3 · formula `f(t)=\lambda e^{-\lambda t},\quad t\ge 0`.

Parameters: `rate` (number, default `0.5`, range 0.25 to 1); `waiting_time` (number, default `5`, range 0 to 12).

Source: manifest `model-1f7a57227d2e.js`; view `visualization-8160441d509d.js` → `ExponentialDistributionVisualization`.

#### Exports

Type `EXPORTS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-bb206c23753c.js` → `ExportsVisualization`.

#### Eye accommodation

Type `EYE_ACCOMMODATION` · manifest v1.

Parameters: `objectDistanceMeters` (number, default `1`, range 0.25 to 6).

Source: manifest `type-42a870b7bbdb.js`; view `visualization-8f2fe41d828d.js` → `EyeAccommodationVisualization`.

#### Eye prescription

Sphere power in diopters

Type `EYE_PRESCRIPTION` · manifest v1.

Parameters: `sphereDiopters` (number, default `2.5`, range -10 to 10); `cylinderDiopters` (number, default `-0.5`, range -6 to 6); `axisDegrees` (number, default `135`, range 0 to 180).

Source: manifest `type-ba89e7f5dcc4.js`; view `visualization-5b5cc4cbf8a9.js` → `EyePrescriptionVisualization`.

#### Factor pairs arrays

Rows in the array

Type `FACTOR_PAIRS_ARRAYS` · manifest v1.

Parameters: `wholeNumber` (integer, default `24`, range 1 to 36).

Source: manifest `model-b7e30c22fb74.js`; view `visualization-5cf7104222dd.js` → `FactorPairsArraysVisualization`.

#### Fahrenheit celsius scale: `F = \frac{9}{5}C + 32`

{landmark}, {valueCount, plural, one {{value} degree Celsius} other {{value} degrees Celsius}}

Type `FAHRENHEIT_CELSIUS_SCALE` · manifest v1 · formula `F = \frac{9}{5}C + 32`.

Parameters: `celsius` (number, default `0`, range -40 to 120).

Source: manifest `type-7ff60fd7b3ba.js`; view `visualization-72f0a99e843f.js` → `FahrenheitCelsiusScaleVisualization`.

#### Faradays law electrolysis: `m=\frac{MQ}{zF},\quad Q=It`

Total charge passed

Type `FARADAYS_LAW_ELECTROLYSIS` · manifest v4 · formula `m=\frac{MQ}{zF},\quad Q=It`.

Parameters: `electrolyte` (enum, default `silver nitrate`, one of `silver nitrate`, `copper(II) sulfate`).

Source: manifest `model-a414c3bf04d3.js`; view `visualization-e8cb2ccc552f.js` → `Visualization`.

#### Fatty acid saturation

Type `FATTY_ACID_SATURATION` · manifest v1.

Parameters: `doubleBonds` (integer, default `1`, range 0 to 3); `temperatureCelsius` (number, default `20`, range 0 to 50).

Source: manifest `model-a41a580621d5.js`; view `visualization-cd806c66cc7a.js` → `FattyAcidSaturationVisualization`.

#### Fermentation

Fermentation route

Type `FERMENTATION` · manifest v2.

Parameters: `fermentation_type` (enum, default `lactic acid`, one of `lactic acid`, `alcohol`).

Source: manifest `model-e9d1e1169b7a.js`; view `visualization-e082a74f8c7e.js` → `FermentationVisualization`.

#### Fifo lifo cost flow

Type `FIFO_LIFO_COST_FLOW` · manifest v1.

Parameters: `unitsSold` (integer, default `180`, range 0 to 300); `priceTrend` (enum, default `rising`, one of `falling`, `flat`, `rising`).

Source: manifest `model-8ce870eed550.js`; view `visualization-2982547f3ea4.js` → `FifoLifoCostFlowVisualization`.

#### Filling rates: `r_{\mathrm{net}}=r_{\mathrm{in}}-r_{\mathrm{out}}`

Type `FILLING_RATES` · manifest v2 · formula `r_{\mathrm{net}}=r_{\mathrm{in}}-r_{\mathrm{out}}`.

Parameters: `inflowRateLitersPerMinute` (number, default `6`, range 0 to 8); `outflowRateLitersPerMinute` (number, default `2`, range 0 to 8).

Source: manifest `type-33d5b92afbca.js`; view `visualization-44acf1eaaadc.js` → `FillingRatesVisualization`.

#### Filtration

Starting mixture

Type `FILTRATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e80ce20a9562.js` → `Visualization`.

#### Finite state machine

Type `FINITE_STATE_MACHINE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-951f8efa66e2.js` → `FiniteStateMachineVisualization`.

#### Fire triangle fire tetrahedron

Fire diagram

Type `FIRE_TRIANGLE_FIRE_TETRAHEDRON`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-dedf228f5667.js` → `Visualization`.

#### Firm cost curves

Selected output quantity

Type `FIRM_COST_CURVES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-fcdcadc2a9aa.js` → `FirmCostCurvesVisualization`.

#### First order ode

Initial value y at x equals {initialX}

Type `FIRST_ORDER_ODE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ef240d3dd853.js` → `FirstOrderOdeVisualization`.

#### Fiscal policy

Type `FISCAL_POLICY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-8848eccbf95f.js` → `FiscalPolicyVisualization`.

#### Fisheries and maximum sustainable yield

Fishing effort index

Type `FISHERIES_AND_MAXIMUM_SUSTAINABLE_YIELD`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-d49dfae72ba1.js` → `FisheriesAndMaximumSustainableYieldVisualization`.

#### Fitness and adaptation

Selective environment

Type `FITNESS_AND_ADAPTATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f649a041cf45.js` → `FitnessAndAdaptationVisualization`.

#### Fixed perimeter rectangle area: `A = w \times h`

Type `FIXED_PERIMETER_RECTANGLE_AREA` · manifest v2 · formula `A = w \times h`.

Parameters: `width` (number, default `4`, range 1 to 11).

Source: manifest `model-b128078a1c67.js`; view `visualization-8f91541968c6.js` → `FixedPerimeterRectangleAreaVisualization`.

#### Fixed ratio scaling

Type `FIXED_RATIO_SCALING` · manifest v3.

Parameters: `scaleFactor` (number, default `1.5`, range 0.5 to 2).

Source: manifest `type-6d69838b61ac.js`; view `visualization-b68ab01675de.js` → `FixedRatioScalingVisualization`.

#### Flower pollination

Pollination type

Type `FLOWER_POLLINATION` · manifest v2.

Parameters: `pollination_type` (enum, default `cross-pollination`, one of `self-pollination`, `cross-pollination`).

Source: manifest `model-eed880ff8885.js`; view `visualization-e938c01ed333.js` → `FlowerPollinationVisualization`.

#### Fluid mosaic membrane

Type `FLUID_MOSAIC_MEMBRANE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-4d5400886db5.js` → `Visualization`.

#### Foil binomial

Type `FOIL_BINOMIAL` · manifest v2.

Parameters: `a` (number, default `1`, range -12 to 12); `b` (number, default `3`, range -12 to 12); `c` (number, default `1`, range -12 to 12); `d` (number, default `2`, range -12 to 12).

Source: manifest `type-49e9f66a2d98.js`; view `visualization-8ac375250bc1.js` → `FoilBinomialVisualization`.

#### Food chain

Trace the food chain

Type `FOOD_CHAIN` · manifest v4.

Parameters: `ecosystem` (enum, default `grassland`, one of `grassland`, `pond`, `ocean`).

Source: manifest `model-b3392fd69f76.js`; view `visualization-b82c6696bbe2.js` → `Visualization`.

#### Food web

Food-chain path

Type `FOOD_WEB` · manifest v1.

Parameters: `ecosystem` (enum, default `terrestrial`, one of `terrestrial`, `freshwater`, `marine`).

Source: manifest `model-c8be72ed6ac0.js`; view `visualization-2e3e66d3c840.js` → `FoodWebVisualization`.

#### Foreign exchange market

Type `FOREIGN_EXCHANGE_MARKET`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e9793de28344.js` → `Visualization`.

#### Forestry methods

Regeneration method

Type `FORESTRY_METHODS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-cc7b1e9e9eed.js` → `Visualization`.

#### Formal charge

Structure {structure}, atom {position}, {element}

Type `FORMAL_CHARGE` · manifest v3.

Parameters: `example` (enum, default `carbon-dioxide-candidates`, one of `carbon-dioxide-candidates`, `nitrite-resonance`, `ammonium`).

Source: manifest `type-23b0e0e9a23b.js`; view `visualization-d3f645e51705.js` → `FormalChargeVisualization`.

#### Fossil fuel formation

Fuel pathway

Type `FOSSIL_FUEL_FORMATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2bfb4bcf959d.js` → `FossilFuelFormationVisualization`.

#### Founder effect and bottleneck

Chance-sampling event

Type `FOUNDER_EFFECT_AND_BOTTLENECK`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-dad59d22ef21.js` → `Visualization`.

#### Four to one multiplexer

Type `FOUR_TO_ONE_MULTIPLEXER` · manifest v2.

Parameters: `input0` (boolean, default `false`); `input1` (boolean, default `true`); `input2` (boolean, default `false`); `input3` (boolean, default `true`); `select1` (boolean, default `false`); `select0` (boolean, default `true`).

Source: manifest `model-85aa75328d7c.js`; view `visualization-9f9ff0425a05.js` → `FourToOneMultiplexerVisualization`.

#### Fractions number line

Type `FRACTIONS_NUMBER_LINE` · manifest v2.

Parameters: `numerator` (integer, default `7`, range 0 to 36); `denominator` (integer, default `4`, range 2 to 12).

Source: manifest `model-e01a7cfd8d48.js`; view `visualization-29c1289f0b81.js` → `FractionsNumberLineVisualization`.

#### Free fall: `h(t) = h_0 + v_0t - \frac{1}{2}gt^2`

Type `FREE_FALL` · manifest v2 · formula `h(t) = h_0 + v_0t - \frac{1}{2}gt^2`.

Parameters: `initialHeightMeters` (number, default `14`, range 4 to 18); `initialVelocityMetersPerSecond` (number, default `0`, range -8 to 8).

Source: manifest `type-f5876f848904.js`; view `visualization-6cb4f2fe8ded.js` → `FreeFallVisualization`.

#### Freezing point depression: `\Delta T_f = iK_fm`

Solute molality in moles per kilogram of solvent

Type `FREEZING_POINT_DEPRESSION` · manifest v3 · formula `\Delta T_f = iK_fm`.

Parameters: `solvent` (enum, default `water`, one of `water`, `benzene`, `cyclohexane`).

Source: manifest `model-ebe02413f5a3.js`; view `visualization-6bd198c197fe.js` → `FreezingPointDepressionVisualization`.

#### Frequency spectrum

Type `FREQUENCY_SPECTRUM`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-425026887fd9.js` → `FrequencySpectrumVisualization`.

#### Function call stack

Program moment

Type `FUNCTION_CALL_STACK`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-25d24987f217.js` → `FunctionCallStackVisualization`.

#### Function composition

Type `FUNCTION_COMPOSITION` · manifest v1.

Parameters: `input_value` (number, default `2`, range -10 to 10); `g_operation` (enum, default `add 2`, one of `add 2`, `multiply by 3`, `square`, `negate`); `f_operation` (enum, default `multiply by 3`, one of `add 2`, `multiply by 3`, `square`, `negate`); `composition_order` (enum, default `g_then_f`, one of `g_then_f`, `f_then_g`).

Source: manifest `type-08ab5fc42dc6.js`; view `visualization-59f9f390bb55.js` → `FunctionCompositionVisualization`.

#### Futures hedge locked revenue

Type `FUTURES_HEDGE_LOCKED_REVENUE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-387533cfa89c.js` → `FuturesHedgeLockedRevenueVisualization`.

#### Fx net exports ad

Type `FX_NET_EXPORTS_AD` · manifest v2.

Parameters: `currency_value` (number, default `1`, range -2 to 2).

Source: manifest `model-1bcf71fb73f9.js`; view `visualization-583c154fa727.js` → `FxNetExportsAdVisualization`.

#### Gains from trade

Good 1 produced

Type `GAINS_FROM_TRADE` · manifest v2.

Parameters: `production_wheat` (number, default `7`, range 5 to 9); `trade_rate` (number, default `1.6`, range 0.4 to 1.8).

Source: manifest `model-80ffe0775316.js`; view `visualization-a6606422aae4.js` → `GainsFromTradeVisualization`.

#### Galvanic cell

Galvanic-cell state

Type `GALVANIC_CELL` · manifest v2.

Parameters: `cell_pair` (enum, default `zinc-copper`, one of `zinc-copper`, `copper-silver`).

Source: manifest `type-448ce06dc011.js`; view `visualization-8d94e57d9313.js` → `Visualization`.

#### Gas solubility

Type `GAS_SOLUBILITY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a4882cdd80e0.js` → `GasSolubilityVisualization`.

#### Gaussian surface symmetry

Type `GAUSSIAN_SURFACE_SYMMETRY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-7d8217f9d9df.js` → `GaussianSurfaceSymmetryVisualization`.

#### Gay lussacs law: `\frac{P_1}{T_1}=\frac{P_2}{T_2}`

Pressure-temperature plot for the same sealed rigid gas sample. State 1 is {temperatureOneCount, plural, one {{temperatureOne} kelvin} other {{temperatureOne} kelvin}} and {pressureOneCount, plural, one {{pressureOne} kilopascal} other {{pressureOne} kilopascals}}. State 2 is {temperatureTwoCount, plural, one {{temperatureTwo} kelvin} other {{temperatureTwo} kelvin}} and {pressureTwoCount, plural, one {{pressureTwo} kilopascal} other {{pressureTwo} kilopascals}}. Volume and gas amount are fixed, so pressure changes in the same proportion as Kelvin temperature.

Type `GAY_LUSSACS_LAW` · manifest v4 · formula `\frac{P_1}{T_1}=\frac{P_2}{T_2}`.

Parameters: `initial_temperature_k` (number, default `300`, range 250 to 400); `initial_pressure_kpa` (number, default `100`, range 50 to 160).

Source: manifest `model-235829f7022e.js`; view `visualization-72fe03cf6175.js` → `GayLussacsLawVisualization`.

#### Gcd

Rectangle side A, {value, plural, one {# unit} other {# units}}. Drag horizontally.

Type `GCD` · manifest v1.

Parameters: `first_number` (integer, default `18`, range 2 to 24); `second_number` (integer, default `12`, range 2 to 24).

Source: manifest `type-a2fa2066a9f8.js`; view `visualization-1ed94cfc59d9.js` → `GcdVisualization`.

#### Gcf lcm

Type `GCF_LCM` · manifest v1.

Parameters: not read (the manifest module could not be evaluated).

Source: manifest `type-58fe70da6bde.js`; view `visualization-8dee6fa678b7.js` → `GcfLcmVisualization`.

#### Gdp expenditure identity

Type `GDP_EXPENDITURE_IDENTITY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a17606082406.js` → `GdpExpenditureIdentityVisualization`.

#### Gdp value double counting

Type `GDP_VALUE_DOUBLE_COUNTING` · manifest v2.

Parameters: `countMode` (enum, default `sales`, one of `sales`, `valueAdded`).

Source: manifest `type-18452383754a.js`; view `visualization-bffcd0f7dd3d.js` → `GdpValueDoubleCountingVisualization`.

#### Genetic drift

Type `GENETIC_DRIFT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-38e3ed07dd14.js` → `Visualization`.

#### Geometric distribution: `P(X=k)=p(1-p)^{k-1}`

Per-trial success probability p

Type `GEOMETRIC_DISTRIBUTION` · manifest v4 · formula `P(X=k)=p(1-p)^{k-1}`.

Parameters: `success_probability` (number, default `0.25`, range 0.05 to 0.8); `selected_trial` (integer, default `4`, range 1 to 16).

Source: manifest `model-435009a98def.js`; view `visualization-21a9b668a91b.js` → `GeometricDistributionVisualization`.

#### Geometric series

First term {variable}

Type `GEOMETRIC_SERIES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a3b4203ea286.js` → `GeometricSeriesVisualization`.

#### Geothermal power

Type `GEOTHERMAL_POWER` · manifest v4.

Parameters: `plant_type` (enum, default `dry steam`, one of `dry steam`, `flash steam`, `binary cycle`).

Source: manifest `model-f5fc9c2ff44e.js`; view `visualization-7491e9d62f90.js` → `GeothermalPowerVisualization`.

#### Ghk membrane potential: `P_{\mathrm{ion}}\uparrow \Rightarrow V_m \to E_{\mathrm{ion}}`

Sodium-to-potassium permeability ratio

Type `GHK_MEMBRANE_POTENTIAL` · manifest v1 · formula `P_{\mathrm{ion}}\uparrow \Rightarrow V_m \to E_{\mathrm{ion}}`.

Parameters: `sodiumToPotassiumPermeabilityRatio` (number, default `0.04`, range 0 to 1); `chlorideToPotassiumPermeabilityRatio` (number, default `0.45`, range 0 to 1).

Source: manifest `type-b2f3bbb776a0.js`; view `visualization-4342ce00e7f5.js` → `GhkMembranePotentialVisualization`.

#### Gibbs free energy: `\Delta G^\circ=-RT\ln K`

Type `GIBBS_FREE_ENERGY` · manifest v3 · formula `\Delta G^\circ=-RT\ln K`, also `\Delta_{\mathrm r}G^\circ=-RT\ln K`.

Parameters: `deltaGKilojoulesPerMole` (number, default `-20`, range -50 to 50).

Source: manifest `type-7d87631529a2.js`; view `visualization-9285631dfa77.js` → `GibbsFreeEnergyVisualization`.

#### Global atmospheric circulation

Circulation cell

Type `GLOBAL_ATMOSPHERIC_CIRCULATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a83b76330815.js` → `Visualization`.

#### Glycolysis

Glycolysis stage

Type `GLYCOLYSIS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-1e723326cfb2.js` → `GlycolysisVisualization`.

#### Gpcr signaling

G-protein pathway

Type `GPCR_SIGNALING` · manifest v1.

Parameters: `pathway` (enum, default `Gs`, one of `Gs`, `Gi`, `Gq`).

Source: manifest `model-e7c8cc43e8df.js`; view `visualization-958ef9eca977.js` → `GpcrSignalingVisualization`.

#### Gpp vs npp: `\mathrm{NPP}=\mathrm{GPP}-R_a`

Gross primary productivity

Type `GPP_VS_NPP` · manifest v2 · formula `\mathrm{NPP}=\mathrm{GPP}-R_a`.

Parameters: `gross_primary_productivity` (number, default `240`, range 100 to 400); `autotrophic_respiration` (number, default `80`, range 0 to 100).

Source: manifest `type-1aff40f97e6c.js`; view `visualization-2398a33490ab.js` → `GppVsNppVisualization`.

#### Gram stain

Type `GRAM_STAIN` · manifest v1.

Parameters: `bacteriaType` (enum, default `positive`, one of `positive`, `negative`).

Source: manifest `type-6ec40c0e5685.js`; view `visualization-d3704c3c3cc1.js` → `GramStainVisualization`.

#### Grand staff piano map

Choose an octave

Type `GRAND_STAFF_PIANO_MAP`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-15c4c517c25a.js` → `Visualization`.

#### Graphable function

Type `GRAPHABLE_FUNCTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-81a659a9cdb2.js` → `GraphableFunctionVisualization`.

#### Graphable function (v2)

Type `GRAPHABLE_FUNCTION_V2`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-82a549a16320.js` → `GraphableFunctionV2Visualization`.

#### Greenhouse infrared trapping

Type `GREENHOUSE_INFRARED_TRAPPING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-d4a215977d89.js` → `GreenhouseInfraredTrappingVisualization`.

#### Guitar chord chart

Type `GUITAR_CHORD_CHART`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f115ed5fe27f.js` → `Visualization`.

#### Guitar fretboard map

Highlight a pitch class

Type `GUITAR_FRETBOARD_MAP`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-bd8e93a08fc8.js` → `Visualization`.

#### Guitar scale patterns

Type `GUITAR_SCALE_PATTERNS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-55f51a5b37d3.js` → `Visualization`.

#### Habitat fragmentation

Patch connectivity

Type `HABITAT_FRAGMENTATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-35052e40e750.js` → `HabitatFragmentationVisualization`.

#### Half full adder logic

Type `HALF_FULL_ADDER_LOGIC` · manifest v2.

Parameters: `a` (boolean, default `true`); `b` (boolean, default `false`); `carryIn` (boolean, default `true`).

Source: manifest `type-6637f6f4ce37.js`; view `visualization-c1a47cec11ef.js` → `HalfFullAdderLogicVisualization`.

#### Half life relation

Type `HALF_LIFE_RELATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f2f3bb2ae773.js` → `HalfLifeRelationVisualization`.

#### Halogen reactivity trend

Type `HALOGEN_REACTIVITY_TREND` · manifest v3.

Parameters: `initial_halogen` (enum, default `chlorine`, one of `chlorine`, `bromine`, `iodine`); `initial_halide` (enum, default `bromide`, one of `chloride`, `bromide`, `iodide`).

Source: manifest `model-9811711de13c.js`; view `visualization-46a814a713a4.js` → `HalogenReactivityVisualization`.

#### Hardy weinberg equilibrium: `p^2 + 2pq + q^2 = 1`

Frequency of allele A

Type `HARDY_WEINBERG_EQUILIBRIUM` · manifest v3 · formula `p^2 + 2pq + q^2 = 1`.

Parameters: `allele_frequency_p` (number, default `0.5`, range 0 to 1).

Source: manifest `model-e6350a687712.js`; view `visualization-27fd3ab1b525.js` → `HardyWeinbergVisualization`.

#### Hash table collisions: `h(k)=k\bmod 7`

Collision-resolution strategy

Type `HASH_TABLE_COLLISIONS` · manifest v2 · formula `h(k)=k\bmod 7`.

Parameters: `resolution_strategy` (enum, default `separate chaining`, one of `separate chaining`, `linear probing`).

Source: manifest `model-8a1ce53f2bd0.js`; view `visualization-75ba395cd702.js` → `HashTableCollisionsVisualization`.

#### Hemoglobin curve

Oxygen partial pressure

Type `HEMOGLOBIN_CURVE` · manifest v1.

Parameters: `oxygenPartialPressureMmHg` (number, default `40`, range 0 to 120); `ph` (number, default `7.4`, range 7.2 to 7.6); `carbonDioxidePartialPressureMmHg` (number, default `40`, range 20 to 60); `temperatureCelsius` (number, default `37`, range 35 to 39).

Source: manifest `type-9f5bb286483b.js`; view `visualization-51255214ad72.js` → `HemoglobinCurveVisualization`.

#### Hemostasis and clotting

Hemostasis stage

Type `HEMOSTASIS_AND_CLOTTING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-d1122be2bebd.js` → `HemostasisVisualization`.

#### Herons formula area

Type `HERONS_FORMULA_AREA`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e93fbd981e80.js` → `HeronsFormulaAreaVisualization`.

#### Heteroskedasticity

Type `HETEROSKEDASTICITY` · manifest v3.

Parameters: `initial_variance_pattern` (enum, default `constant`, one of `constant`, `increasing`, `decreasing`, `bulge`).

Source: manifest `model-45fb684d19d6.js`; view `visualization-e64fead20e7f.js` → `HeteroskedasticityVisualization`.

#### Histogram

Distribution shape

Type `HISTOGRAM` · manifest v2.

Parameters: `distribution_shape` (enum, default `roughly symmetric`, one of `roughly symmetric`, `skewed right`, `bimodal`, `gap or outlier`).

Source: manifest `model-dbdb00b115a8.js`; view `visualization-acb0e18845c9.js` → `HistogramVisualization`.

#### Homogeneous ode roots: `ay''+by'+cy=0`

Coefficient {coefficient} for {dependentVariable} double prime

Type `HOMOGENEOUS_ODE_ROOTS` · manifest v3 · formula `ay''+by'+cy=0`.

Parameters: `a` (number, default `1`, range 0.1 to 100); `b` (number, default `2`, range -10000 to 10000); `c` (number, default `5`, range -10000 to 10000).

Source: manifest `type-9e1fda92abdc.js`; view `visualization-766db1efdba8.js` → `HomogeneousOdeRootsVisualization`.

#### Homogeneous vs heterogeneous mixture

Type `HOMOGENEOUS_VS_HETEROGENEOUS_MIXTURE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-859b3b17a877.js` → `Visualization`.

#### Homologous structures

Trace a corresponding bone group

Type `HOMOLOGOUS_STRUCTURES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-1241e8b835a2.js` → `HomologousStructuresVisualization`.

#### Hookes law

Type `HOOKES_LAW`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2dcc81ae25e1.js` → `HookesLawVisualization`.

#### Http protocol

{protocol} exchange step

Type `HTTP_PROTOCOL`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-4394a3fd1d1b.js` → `HttpProtocolVisualization`.

#### Human body systems map

Select an organ system

Type `HUMAN_BODY_SYSTEMS_MAP` · manifest v3.

Parameters: `focus_system` (enum, default `respiratory`, one of `integumentary`, `skeletal`, `muscular`, `nervous`, `endocrine`, `cardiovascular`, `lymphatic-immune`, `respiratory`, `digestive`, `urinary-excretory`, `reproductive`).

Source: manifest `model-31563588c1d0.js`; view `visualization-38853d4dc7c5.js` → `Visualization`.

#### Hybridization sigma pi bonds

Type `HYBRIDIZATION_SIGMA_PI_BONDS` · manifest v1.

Parameters: `hybridization` (enum, default `sp2`, one of `sp3`, `sp2`, `sp`).

Source: manifest `type-6fafbd960065.js`; view `visualization-b0d3b5107168.js` → `HybridizationVisualization`.

#### Hydrocarbon structures

Type `HYDROCARBON_STRUCTURES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-def963ad7149.js` → `Visualization`.

#### Hydroelectric dam

Type `HYDROELECTRIC_DAM`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-11b76011df57.js` → `Visualization`.

#### Hydrogen fuel cell

Fuel-cell process stage

Type `HYDROGEN_FUEL_CELL`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-82f4ae688b83.js` → `HydrogenFuelCellVisualization`.

#### Hypergeometric distribution: `P(X=k)=\frac{\binom{K}{k}\binom{N-K}{n-k}}{\binom{N}{n}}`

Successes in the population

Type `HYPERGEOMETRIC_DISTRIBUTION` · manifest v5 · formula `P(X=k)=\frac{\binom{K}{k}\binom{N-K}{n-k}}{\binom{N}{n}}`.

Parameters: `population_size` (integer, default `12`, range 12 to 24); `population_successes` (integer, default `5`, range 0 to 12); `sample_size` (integer, default `7`, range 1 to 12).

Source: manifest `model-e077e5821034.js`; view `visualization-15490c0fc41c.js` → `HypergeometricDistributionVisualization`.

#### Hyperopia

Object distance in meters

Type `HYPEROPIA` · manifest v3.

Parameters: `objectDistanceMeters` (number, default `0.5`, range 0.25 to 6).

Source: manifest `type-9f359e6ad739.js`; view `visualization-d7d994791423.js` → `HyperopiaVisualization`.

#### Ideal transformer: `\frac{V_s}{V_p}=\frac{N_s}{N_p}`

Type `IDEAL_TRANSFORMER` · manifest v2 · formula `\frac{V_s}{V_p}=\frac{N_s}{N_p}`.

Parameters: `turnsRatio` (number, default `2`, range 0.1 to 10); `loadResistanceOhms` (number, default `30`, range 1 to 10000).

Source: manifest `type-f90cbc2eec2d.js`; view `visualization-43c916062366.js` → `IdealTransformerVisualization`.

#### Ieee 754 floating point: `x=(-1)^s(1.f)_2\,2^{E-\mathrm{bias}}`

Type `IEEE_754_FLOATING_POINT` · manifest v2 · formula `x=(-1)^s(1.f)_2\,2^{E-\mathrm{bias}}`.

Parameters: `precision` (enum, default `single`, one of `single`, `double`).

Source: manifest `model-cdb21fd8d79e.js`; view `visualization-7af8a4b1c483.js` → `Ieee754Visualization`.

#### If statement execution flow

Score

Type `IF_STATEMENT_EXECUTION_FLOW` · manifest v1.

Parameters: `score` (integer, default `60`, range 0 to 100).

Source: manifest `type-62569be7b3b6.js`; view `visualization-61b28cc9cc5e.js` → `IfStatementExecutionFlowVisualization`.

#### Igneous cooling rate and crystal size

Slow underground cooling

Type `IGNEOUS_COOLING_RATE_AND_CRYSTAL_SIZE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f86f76a011ae.js` → `Visualization`.

#### Immune cell phagocytosis

Phagocytosis stage

Type `IMMUNE_CELL_PHAGOCYTOSIS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-941837592953.js` → `ImmuneCellPhagocytosisVisualization`.

#### Import quota

Type `IMPORT_QUOTA`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2dacd9d2aad4.js` → `ImportQuotaVisualization`.

#### Incidence vs prevalence

Type `INCIDENCE_VS_PREVALENCE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-71302b803429.js` → `IncidenceVsPrevalenceVisualization`.

#### Inclined plane acceleration: `a = g \sin \theta`

Incline angle

Type `INCLINED_PLANE_ACCELERATION` · manifest v2 · formula `a = g \sin \theta`.

Parameters: `planeAngleDegrees` (number, default `30`, range 15 to 45); `boxMassKilograms` (number, default `4`, range 2 to 6).

Source: manifest `type-dc5d4e4fe966.js`; view `visualization-61c28ea7e528.js` → `InclinedPlaneAccelerationVisualization`.

#### Independent assortment

Metaphase-I orientation

Type `INDEPENDENT_ASSORTMENT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-81441bbb19a1.js` → `Visualization`.

#### Independent probability intersection

Type `INDEPENDENT_PROBABILITY_INTERSECTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e3bf9f575bd3.js` → `IndependentProbabilityIntersectionVisualization`.

#### Initial rate experiment: `\frac{r_{0,2}}{r_{0,1}}=\left(\frac{[X]_{0,2}}{[X]_{0,1}}\right)^p`

Vary reactant {reactant}

Type `INITIAL_RATE_EXPERIMENT` · manifest v3 · formula `\frac{r_{0,2}}{r_{0,1}}=\left(\frac{[X]_{0,2}}{[X]_{0,1}}\right)^p`.

Parameters: `order_a` (enum, default `first`, one of `zero`, `first`, `second`); `order_b` (enum, default `second`, one of `zero`, `first`, `second`).

Source: manifest `model-353d6b580655.js`; view `visualization-8670bb70a792.js` → `InitialRateExperimentVisualization`.

#### Innate vs adaptive immunity

Immune-response timeline

Type `INNATE_VS_ADAPTIVE_IMMUNITY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-7d1f2181dd0b.js` → `Visualization`.

#### Insertion sort

Insertion sort actions

Type `INSERTION_SORT` · manifest v1.

Parameters: `value1` (number, default `7`, range 1 to 9); `value2` (number, default `3`, range 1 to 9); `value3` (number, default `8`, range 1 to 9); `value4` (number, default `2`, range 1 to 9); `value5` (number, default `6`, range 1 to 9); `value6` (number, default `4`, range 1 to 9); `value7` (number, default `5`, range 1 to 9).

Source: manifest `model-9ce2e0b98e4f.js`; view `visualization-a26136f246ec.js` → `InsertionSortVisualization`.

#### Instrument families

Type `INSTRUMENT_FAMILIES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-676875e09cf9.js` → `Visualization`.

#### Insulin deficiency vs resistance

Type `INSULIN_DEFICIENCY_VS_RESISTANCE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-240f348e0a12.js` → `Visualization`.

#### Integral

Type `INTEGRAL`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-6a9d56da6a54.js` → `IntegralVisualization`.

#### Integration by parts

Type `INTEGRATION_BY_PARTS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-9eb446d31e92.js` → `IntegrationByPartsVisualization`.

#### Integration estimation

Type `INTEGRATION_ESTIMATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-963bae2b7cc8.js` → `IntegrationEstimationVisualization`.

#### Intermolecular forces

Choose a molecular example

Type `INTERMOLECULAR_FORCES` · manifest v1.

Parameters: `initial_example` (enum, default `water`, one of `methane`, `hydrogen chloride`, `water`).

Source: manifest `type-9e89df8b418e.js`; view `visualization-5e596324656e.js` → `IntermolecularForcesVisualization`.

#### International trade world price

Type `INTERNATIONAL_TRADE_WORLD_PRICE` · manifest v3.

Parameters: `world_price` (number, default `40`, range 18 to 82).

Source: manifest `type-df5248337cc3.js`; view `visualization-a166e9d6a474.js` → `InternationalTradeWorldPriceVisualization`.

#### Ionic bond formation

Type `IONIC_BOND_FORMATION` · manifest v2.

Parameters: `compound` (enum, default `sodium chloride`, one of `sodium chloride`, `magnesium oxide`, `magnesium chloride`, `sodium oxide`).

Source: manifest `model-483deeec96b8.js`; view `visualization-e896b4f7dd9f.js` → `IonicBondFormationVisualization`.

#### Ionic formulas

Choose a cation

Type `IONIC_FORMULAS` · manifest v2.

Parameters: `cation` (enum, default `aluminum`, one of `sodium`, `potassium`, `silver`, `magnesium`, `calcium`, `zinc`, `barium`, `aluminum`, `iron_iii`); `anion` (enum, default `oxide`, one of `chloride`, `fluoride`, `bromide`, `oxide`, `sulfide`, `nitride`, `phosphide`).

Source: manifest `type-892c2b1ba446.js`; view `visualization-aaea8b863af3.js` → `IonicFormulasVisualization`.

#### Ionic lattice

Sodium ion center

Type `IONIC_LATTICE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a9c92c2df627.js` → `Visualization`.

#### Ionic vs covalent

Type `IONIC_VS_COVALENT` · manifest v1.

Parameters: `bondType` (enum, default `ionic`, one of `ionic`, `covalent`).

Source: manifest `type-72520cdd5971.js`; view `visualization-9fb7858a648c.js` → `IonicVsCovalentVisualization`.

#### Ir spectroscopy

Type `IR_SPECTROSCOPY` · manifest v2.

Parameters: `initial_molecular_class` (enum, default `alcohol`, one of `alkane`, `alcohol`, `ketone`, `carboxylic acid`, `nitrile`).

Source: manifest `model-4e2972a7ab7b.js`; view `visualization-56acc46836f1.js` → `Visualization`.

#### Irrigation and salinization

Drainage condition

Type `IRRIGATION_AND_SALINIZATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-6737754b55ed.js` → `IrrigationVisualization`.

#### Island biogeography

Island-biogeography equilibrium graph for a {case}. Equilibrium richness is {richness} of {sourcePool} source-pool species. Immigration and extinction are equal at a nonzero turnover rate of {turnover}. The four cases run from small and far, with the fewest species, to large and near, with the most.

Type `ISLAND_BIOGEOGRAPHY` · manifest v4.

Parameters: `island_area` (enum, default `large`, one of `small`, `large`); `isolation` (enum, default `near`, one of `near`, `far`).

Source: manifest `model-a8957b9529f0.js`; view `visualization-2d0c9e5ccdd5.js` → `Visualization`.

#### Isosceles triangle

Type `ISOSCELES_TRIANGLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-af38adf7f292.js` → `IsoscelesTriangleVisualization`.

#### Isotope atomic mass

Choose an element

Type `ISOTOPE_ATOMIC_MASS` · manifest v2.

Parameters: `element` (enum, default `chlorine`, one of `boron`, `carbon`, `neon`, `magnesium`, `sulfur`, `chlorine`, `copper`).

Source: manifest `type-b5e0ca3b765a.js`; view `visualization-b7e114c671ee.js` → `IsotopeAtomicMassVisualization`.

#### Iupac hydrocarbon naming

Type `IUPAC_HYDROCARBON_NAMING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e269d2be2b7e.js` → `Visualization`.

#### Joint marginal conditional table

{rowLabel} and {columnLabel}: {count, plural, one {# student} other {# students}}

Type `JOINT_MARGINAL_CONDITIONAL_TABLE` · manifest v2.

Parameters: `probabilityQuestion` (enum, default `passed_and_studied`, one of `passed_and_studied`, `passed_and_did_not_study`, `did_not_pass_and_studied`, `did_not_pass_and_did_not_study`, `passed`, `did_not_pass`, `studied`, `did_not_study`, `studied_given_passed`, `did_not_study_given_passed`, `studied_given_did_not_pass`, `did_not_study_given_did_not_pass`, `passed_given_studied`, `did_not_pass_given_studied`, `passed_given_did_not_study`, `did_not_pass_given_did_not_study`).

Source: manifest `model-fd7375308d68.js`; view `visualization-86b29f1ba021.js` → `JointMarginalConditionalTableVisualization`.

#### Kaplan meier survival curve

No censoring

Type `KAPLAN_MEIER_SURVIVAL_CURVE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ab0c99be8b1b.js` → `Visualization`.

#### Keynesian cross

Marginal propensity to consume

Type `KEYNESIAN_CROSS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-83163725f438.js` → `KeynesianCrossVisualization`.

#### Keystone species and trophic cascade

Keystone present

Type `KEYSTONE_SPECIES_AND_TROPHIC_CASCADE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-babe624c803b.js` → `KeystoneCascadeVisualization`.

#### Kinase cascade

Kinase cascade stage

Type `KINASE_CASCADE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-9ab246340a24.js` → `KinaseCascadeVisualization`.

#### Kinematics velocity: `v_f = v_i + at`

Type `KINEMATICS_VELOCITY` · manifest v3 (also v3, v3, v3) · formula `v_f = v_i + at`, also `v = u + at`, `v = v_0 + at`, `u + at = v`.

Parameters: `initialVelocityMetersPerSecond` (number, default `2`, range -6 to 10); `accelerationMetersPerSecondSquared` (number, default `1`, range -2 to 4); `timeSeconds` (number, default `5`, range 1 to 9).

Source: manifest `type-ce7a4fb22b44.js`; view `visualization-7d7e754d3f9c.js` → `KinematicsDisplacementUniformAccelerationVisualization`.

#### Kinetic and potential energy: `E_{\text{total}} = PE + KE`

Type `KINETIC_AND_POTENTIAL_ENERGY` · manifest v2 · formula `E_{\text{total}} = PE + KE`.

Parameters: `startHeightMeters` (number, default `6`, range 2 to 10).

Source: manifest `type-ae7b919b937d.js`; view `visualization-d9d7cce4c832.js` → `KineticPotentialEnergyVisualization`.

#### Kinetic energy: `\mathrm{KE} = \frac{1}{2}mv^2`

Type `KINETIC_ENERGY` · manifest v2 · formula `\mathrm{KE} = \frac{1}{2}mv^2`, also `KE = \frac{1}{2}mv^2`, `K = \frac{1}{2}mv^2`, `KE = mv^2/2`, `K = mv^2/2`, `\frac{1}{2}mv^2 = KE`, `mv^2/2 = KE`.

Parameters: `mass` (number, default `5`, range 1 to 9); `velocity` (number, default `0`, range -10 to 10).

Source: manifest `type-e6de8eed347a.js`; view `visualization-e8081c10253f.js` → `KineticEnergyVisualization`.

#### Knn neighbor voting

Number of nearest neighbors

Type `KNN_NEIGHBOR_VOTING` · manifest v1.

Parameters: `k` (integer, default `5`, range 1 to 9); `queryX` (number, default `5.2`, range 0 to 10); `queryY` (number, default `3.3`, range 0 to 10).

Source: manifest `model-9d831e60e68f.js`; view `visualization-20d0272a45db.js` → `KnnNeighborVotingVisualization`.

#### Labeled drum kit

Drum-kit component

Type `LABELED_DRUM_KIT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-fab2de675f77.js` → `LabeledDrumKitVisualization`.

#### Labor force flows

Type `LABOR_FORCE_FLOWS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-54a55945f668.js` → `LaborForceFlowsVisualization`.

#### Labor markets

Type `LABOR_MARKETS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-c29fd960682c.js` → `FactorMarketEquilibriumVisualization`.

#### Lac operon

Type `LAC_OPERON`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-7192a3925af9.js` → `Visualization`.

#### Laffer curve

Type `LAFFER_CURVE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-d497890c3497.js` → `Visualization`.

#### Land and sea breeze

Type `LAND_AND_SEA_BREEZE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f0930415dc20.js` → `Visualization`.

#### Landfill design

Water entry, from dry to heavy rainfall

Type `LANDFILL_DESIGN`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-240d8da001d0.js` → `Visualization`.

#### Landslide risk and movement types

Movement type

Type `LANDSLIDE_RISK_AND_MOVEMENT_TYPES` · manifest v2.

Parameters: `initial_movement_type` (enum, default `fall`, one of `fall`, `topple`, `rotational slide`, `translational slide`, `spread`, `flow`).

Source: manifest `model-a050f4969274.js`; view `visualization-efb5a2148cc1.js` → `Visualization`.

#### Latitude longitude

Type `LATITUDE_LONGITUDE` · manifest v1.

Parameters: `latitude` (integer, default `30`, range -90 to 90); `longitude` (integer, default `45`, range -180 to 180).

Source: manifest `model-fe09a72207e2.js`; view `visualization-8a6122199faf.js` → `Visualization`.

#### Law of cosines

Type `LAW_OF_COSINES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-44efec81c440.js` → `LawOfCosinesVisualization`.

#### Law of definite proportions

Sample-size multiplier

Type `LAW_OF_DEFINITE_PROPORTIONS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-c44633fb0a7d.js` → `LawOfDefiniteProportionsVisualization`.

#### Law of reflection: `\theta_i = \theta_r`

Type `LAW_OF_REFLECTION` · manifest v3 · formula `\theta_i = \theta_r`.

Parameters: `incidentAngleDeg` (number, default `40`, range 10 to 75).

Source: manifest `model-2bccbf866c14.js`; view `visualization-270c2104fc79.js` → `LawOfReflectionVisualization`.

#### Lcm

Type `LCM` · manifest v4.

Parameters: `first_number` (integer, default `4`, range 1 to 12); `second_number` (integer, default `6`, range 1 to 12).

Source: manifest `type-afc86e267b1f.js`; view `visualization-12b145431c19.js` → `LcmVisualization`.

#### Ld50 dose response curve

Administered dose in milligrams per kilogram

Type `LD50_DOSE_RESPONSE_CURVE` · manifest v5.

Parameters: `reference_ld50_mg_per_kg` (number, default `100`, range 3 to 300); `comparison_ld50_mg_per_kg` (number, default `30`, range 3 to 300).

Source: manifest `model-5e134de0146d.js`; view `visualization-7bd719e5b9af.js` → `Visualization`.

#### Le chateliers principle

Select the equilibrium stress

Type `LE_CHATELIERS_PRINCIPLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-65c7015ae363.js` → `Visualization`.

#### Least square regression

Observed data points

Type `LEAST_SQUARE_REGRESSION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-da3e95b032e2.js` → `LeastSquareRegressionVisualization`.

#### Lens equation: `\frac{1}{f} = \frac{1}{d_o} + \frac{1}{d_i}`

Type `LENS_EQUATION` · manifest v4 · formula `\frac{1}{f} = \frac{1}{d_o} + \frac{1}{d_i}`, also `\frac{1}{f} = \frac{1}{a} + \frac{1}{b}`, `1/f=1/do+1/di`, `1/f=1/di+1/do`, `1/f=1/b+1/a`, `1/do+1/di=1/f`, `1/di+1/do=1/f`, `1/a+1/b=1/f`, `1/b+1/a=1/f`.

Parameters: `objectDistance` (number, default `32`, range 0.01 to 10000); `focalLength` (number, default `16`, range -10000 to 10000).

Source: manifest `type-2b5f6faeedd9.js`; view `visualization-e2763333b60c.js` → `LensEquationVisualization`.

#### Levels of organization

Type `LEVELS_OF_ORGANIZATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b956c0de1ffe.js` → `Visualization`.

#### Lewis dot symbols

{name} ({symbol})

Type `LEWIS_DOT_SYMBOLS` · manifest v2.

Parameters: `element` (enum, default `C`, one of `H`, `He`, `Li`, `Be`, `B`, `C`, `N`, `O`, `F`, `Ne`, `Na`, `Mg`, `Al`, `Si`, `P`, `S`, `Cl`, `Ar`).

Source: manifest `type-84ec9bea3a73.js`; view `visualization-538e99009a3e.js` → `Visualization`.

#### Lewis structure builder

Molecule or ion

Type `LEWIS_STRUCTURE_BUILDER` · manifest v3.

Parameters: `molecule` (enum, default `carbon dioxide`, one of `water`, `ammonia`, `carbon dioxide`, `hydrogen cyanide`, `formate ion`, `nitrite ion`).

Source: manifest `model-afc621595d57.js`; view `visualization-342de2864de0.js` → `Visualization`.

#### Likelihood function: `L(p\mid k,n) \propto p^k(1-p)^{n-k}`

Observed successes

Type `LIKELIHOOD_FUNCTION` · manifest v3 · formula `L(p\mid k,n) \propto p^k(1-p)^{n-k}`.

Parameters: `successes` (integer, default `3`, range 0 to 48); `trials` (integer, default `12`, range 12 to 48).

Source: manifest `type-8c2ee062fabe.js`; view `visualization-62ef1389c3c1.js` → `LikelihoodFunctionVisualization`.

#### Limiting reactant

Starting hydrogen molecules

Type `LIMITING_REACTANT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-504ef943eff2.js` → `LimitingReactantVisualization`.

#### Linear combination: `\vec{w}=a\vec{u}+b\vec{v}`

Multiplier {multiplier} for vector {vector}

Type `LINEAR_COMBINATION` · manifest v2 · formula `\vec{w}=a\vec{u}+b\vec{v}`.

Parameters: `coefficientA` (number, default `1`, range -2 to 2); `coefficientB` (number, default `1`, range -2 to 2).

Source: manifest `type-f010dd668ee0.js`; view `visualization-5003eead0a7f.js` → `LinearCombinationVisualization`.

#### Linear equation two vars simple

Type `LINEAR_EQUATION_TWO_VARS_SIMPLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-8735f197886d.js` → `LinearEquationTwoVarsSimpleVisualization`.

#### Linear independence discriminant: `A=\left|\det(\mathbf{u},\mathbf{v})\right|`

Type `LINEAR_INDEPENDENCE_DISCRIMINANT` · manifest v2 · formula `A=\left|\det(\mathbf{u},\mathbf{v})\right|`, also `\det(\mathbf{u},\mathbf{v})=u_xv_y-u_yv_x`, `\det(\mathbf{u},\mathbf{v})\ne 0`.

Parameters: `uX` (number, default `4`, range -20 to 20); `uY` (number, default `1`, range -20 to 20); `vX` (number, default `1`, range -20 to 20); `vY` (number, default `3`, range -20 to 20).

Source: manifest `type-630959edaee6.js`; view `visualization-691b770e02f6.js` → `LinearIndependenceVisualization`.

#### Linear inequalities feasible region

Bounded feasible region preset

Type `LINEAR_INEQUALITIES_FEASIBLE_REGION` · manifest v1.

Parameters: `slope1` (number, default `1`, range -4 to 4); `intercept1` (number, default `-2`, range -6 to 6); `relation1` (enum, default `>=`, one of `<=`, `>=`, `<`, `>`); `slope2` (number, default `-1`, range -4 to 4); `intercept2` (number, default `-2`, range -6 to 6); `relation2` (enum, default `>=`, one of `<=`, `>=`, `<`, `>`); `slope3` (number, default `0`, range -4 to 4); `intercept3` (number, default `3`, range -6 to 6); `relation3` (enum, default `<=`, one of `<=`, `>=`, `<`, `>`).

Source: manifest `model-84524f724fa2.js`; view `visualization-87b1f5971f21.js` → `LinearInequalitiesFeasibleRegionVisualization`.

#### Linear inequality solution ray: `ax + b \lessgtr c`

Coefficient {a}

Type `LINEAR_INEQUALITY_SOLUTION_RAY` · manifest v1 · formula `ax + b \lessgtr c`.

Parameters: `a` (integer, default `-3`, range -5 to 5); `b` (number, default `2`, range -12 to 12); `c` (number, default `11`, range -12 to 12); `relation` (enum, default `greater_than`, one of `less_than`, `greater_than`).

Source: manifest `model-f27f59868f2e.js`; view `visualization-e9e7a02a7f65.js` → `LinearInequalitySolutionRayVisualization`.

#### Lipids and phospholipids

Type `LIPIDS_AND_PHOSPHOLIPIDS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-1ca8cd5a18f5.js` → `Visualization`.

#### Loanable funds

Type `LOANABLE_FUNDS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-21fc5018acce.js` → `LoanableFundsVisualization`.

#### Logarithm inverse exponential

Type `LOGARITHM_INVERSE_EXPONENTIAL`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a67c1db08b7d.js` → `LogarithmInverseExponentialVisualization`.

#### Logistic growth

Type `LOGISTIC_GROWTH`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-261b854e6c41.js` → `LogisticGrowthVisualization`.

#### Logistic regression: `P(Y=1\mid x)=\frac{1}{1+e^{-(\beta_0+\beta_1x)}}`

Continuous predictor value

Type `LOGISTIC_REGRESSION` · manifest v3 · formula `P(Y=1\mid x)=\frac{1}{1+e^{-(\beta_0+\beta_1x)}}`.

Parameters: `intercept` (number, default `-0.5`, range -2 to 2); `coefficient` (number, default `1.2`, range -2.5 to 2.5).

Source: manifest `type-8875ae84811a.js`; view `visualization-4159ee7500f4.js` → `LogisticRegressionVisualization`.

#### Long division

Type `LONG_DIVISION` · manifest v1.

Parameters: `dividend` (integer, default `458`, range 1 to 9999); `divisor` (integer, default `3`, range 1 to 99).

Source: manifest `type-eb0199ee4cef.js`; view `visualization-7308d4d71c88.js` → `LongDivisionVisualization`.

#### Long run growth

Type `LONG_RUN_GROWTH`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-564464e89281.js` → `LongRunGrowthVisualization`.

#### Loop break control flow

Break condition outcome

Type `LOOP_BREAK_CONTROL_FLOW` · manifest v3.

Parameters: `loop_kind` (enum, default `for`, one of `for`, `while`); `loop_limit` (integer, default `5`, range 3 to 5); `break_value` (integer, default `2`, range 1 to 6).

Source: manifest `type-b7a8fbf7a420.js`; view `visualization-21c486e57166.js` → `LoopBreakControlFlowVisualization`.

#### Lorenz curve

Income inequality Gini coefficient

Type `LORENZ_CURVE` · manifest v4.

Parameters: `gini_coefficient` (number, default `0.33`, range 0 to 0.65); `population_share` (number, default `50`, range 0 to 100).

Source: manifest `type-a513a18b2ee6.js`; view `visualization-702ad534dcc2.js` → `LorenzCurveVisualization`.

#### Lras

Type `LRAS` · manifest v1.

Parameters: `capacity_change_percent` (number, default `15`, range -35 to 35).

Source: manifest `model-182295b28076.js`; view `visualization-7f4f7d5687a5.js` → `LrasVisualization`.

#### Lung gas gradient

Oxygen partial pressure in the alveolus

Type `LUNG_GAS_GRADIENT` · manifest v1.

Parameters: `alveolarOxygenPartialPressureMmHg` (number, default `100`, range 0 to 300); `bloodOxygenPartialPressureMmHg` (number, default `40`, range 0 to 300); `alveolarCarbonDioxidePartialPressureMmHg` (number, default `40`, range 0 to 150); `bloodCarbonDioxidePartialPressureMmHg` (number, default `45`, range 0 to 150).

Source: manifest `type-8a9437331f93.js`; view `visualization-455a9bfc09b2.js` → `LungGasGradientVisualization`.

#### Lytic vs lysogenic virus cycle

Infection pathway

Type `LYTIC_VS_LYSOGENIC_VIRUS_CYCLE` · manifest v2.

Parameters: `initial_pathway` (enum, default `lytic`, one of `lytic`, `lysogenic`).

Source: manifest `type-ee3c6146db4d.js`; view `visualization-80ebbf0d345c.js` → `VirusCycleVisualization`.

#### Magnet induced current

Magnet motion animation controls

Type `MAGNET_INDUCED_CURRENT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-d3a954490544.js` → `MagnetInducedCurrentVisualization`.

#### Magnet induced current direction

Type `MAGNET_INDUCED_CURRENT_DIRECTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-c84798ac5993.js` → `MagnetInducedCurrentDirectionVisualization`.

#### Magnetic field direction on charge: `\vec F_B=q\vec v\times\vec B`

Velocity direction angle

Type `MAGNETIC_FIELD_DIRECTION_ON_CHARGE` · manifest v1 · formula `\vec F_B=q\vec v\times\vec B`.

Parameters: `velocityAngleDegrees` (number, default `0`, range 0 to 360); `fieldDirection` (enum, default `into-page`, one of `into-page`, `out-of-page`); `chargeSign` (enum, default `positive`, one of `positive`, `negative`).

Source: manifest `type-f09422f3bf66.js`; view `visualization-a817424b9ef0.js` → `MagneticFieldDirectionVisualization`.

#### Map measurement

{point} horizontal position

Type `MAP_MEASUREMENT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-6d4924af0ee5.js` → `MapMeasurementVisualization`.

#### Marginal analysis

Selected quantity

Type `MARGINAL_ANALYSIS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-5f8f5570ae3a.js` → `MarginalAnalysisVisualization`.

#### Markovnikov alkene addition

HBr-addition step

Type `MARKOVNIKOV_ALKENE_ADDITION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-564b0edc709d.js` → `Visualization`.

#### Mass density volume relation: `\rho = \frac{m}{V}`

Type `MASS_DENSITY_VOLUME_RELATION` · manifest v4 · formula `\rho = \frac{m}{V}`, also `m = \rho V`, `rho = m / V`, `rho=m/v`, `d=m/v`, `m=rho v`, `m=dv`, `v=m/rho`, `v=m/d`, `m/v=rho`, `m/v=d`.

Parameters: `mass` (number, default `12`, range 0.01 to 10000); `volume` (number, default `5`, range 0.01 to 10000).

Source: manifest `type-18b6b503ca52.js`; view `visualization-5173c549efe9.js` → `MassDensityVolumeRelationVisualization`.

#### Mass spectrum

Choose a mass-spectrum example

Type `MASS_SPECTRUM` · manifest v4.

Parameters: `example` (enum, default `fragment-dominant`, one of `fragment-dominant`, `molecular-ion-dominant`, `chlorine-isotope-pattern`, `bromine-isotope-pattern`).

Source: manifest `type-793044e0b754.js`; view `visualization-46682d199b71.js` → `MassSpectrumVisualization`.

#### Mass spring shm: `T = 2\pi\sqrt{\frac{m}{k}}`

Mass-spring animation controls

Type `MASS_SPRING_SHM` · manifest v2 · formula `T = 2\pi\sqrt{\frac{m}{k}}`.

Parameters: `massKilograms` (number, default `1.5`, range 0.5 to 5); `springConstantNewtonsPerMeter` (number, default `40`, range 10 to 100); `amplitudeMeters` (number, default `0.25`, range 0.05 to 0.5).

Source: manifest `type-a880aebad1b1.js`; view `visualization-d6aba342f880.js` → `MassSpringShmVisualization`.

#### Matched pairs design

Choose matched-pairs design variant

Type `MATCHED_PAIRS_DESIGN` · manifest v3.

Parameters: `design_variant` (enum, default `separate-units`, one of `separate-units`, `self-paired`).

Source: manifest `model-3df69373af20.js`; view `visualization-5904e0bba98f.js` → `Visualization`.

#### Matrix inverse 2d: `A^{-1}A=I\quad A^{-1}Ax=x`

Type `MATRIX_INVERSE_2D` · manifest v1 · formula `A^{-1}A=I\quad A^{-1}Ax=x`.

Parameters: `matrixA` (number, default `0`, range -2 to 2); `matrixB` (number, default `1`, range -2 to 2); `matrixC` (number, default `-1`, range -2 to 2); `matrixD` (number, default `0`, range -2 to 2); `vectorX` (number, default `1`, range -5 to 5); `vectorY` (number, default `2`, range -5 to 5).

Source: manifest `type-654523ab98b5.js`; view `visualization-3999b6019de0.js` → `MatrixInverseVisualization`.

#### Matrix multiplication row column rule

Type `MATRIX_MULTIPLICATION_ROW_COLUMN_RULE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-673c1a559d5b.js` → `MatrixMultiplicationRowColumnRuleVisualization`.

#### Matrix transformation 2d: `A\vec{v}=\begin{bmatrix}a&b\\c&d\end{bmatrix}\begin{bmatrix}x\\y\end{bmatrix}`

Type `MATRIX_TRANSFORMATION_2D` · manifest v1 · formula `A\vec{v}=\begin{bmatrix}a&b\\c&d\end{bmatrix}\begin{bmatrix}x\\y\end{bmatrix}`.

Parameters: `matrixA` (number, default `2`, range -2 to 2); `matrixB` (number, default `0`, range -2 to 2); `matrixC` (number, default `0`, range -2 to 2); `matrixD` (number, default `2`, range -2 to 2); `vectorX` (number, default `1`, range -1.5 to 1.5); `vectorY` (number, default `1`, range -1.5 to 1.5).

Source: manifest `type-e537504d901a.js`; view `visualization-ff242e5d29ed.js` → `MatrixTransformationVisualization`.

#### Maxwell boltzmann distribution

Type `MAXWELL_BOLTZMANN_DISTRIBUTION` · manifest v4.

Parameters: `temperature_kelvin` (number, default `300`, range 200 to 800); `molar_mass_g_per_mol` (number, default `28`, range 4 to 80).

Source: manifest `type-f22c71cb1245.js`; view `visualization-c99288bbb322.js` → `MaxwellBoltzmannVisualization`.

#### Mean as balance point

Data set

Type `MEAN_AS_BALANCE_POINT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-affa7e9f265e.js` → `MeanAsBalancePointVisualization`.

#### Mean value theorem: `f'(c) = \frac{f(b) - f(a)}{b - a}`

Type `MEAN_VALUE_THEOREM` · manifest v3 · formula `f'(c) = \frac{f(b) - f(a)}{b - a}`.

Parameters: `cubicCoefficient` (number, default `0`, range -5 to 5); `quadraticCoefficient` (number, default `-0.25`, range -10 to 10); `linearCoefficient` (number, default `0.8`, range -20 to 20); `constantTerm` (number, default `4`, range -100 to 100); `intervalCenter` (number, default `5`, range -8 to 8); `intervalWidth` (number, default `2`, range 0.5 to 16).

Source: manifest `model-816de77e9772.js`; view `visualization-377c5035dbf4.js` → `MeanValueTheoremVisualization`.

#### Mean vs median

Type `MEAN_VS_MEDIAN` · manifest v1.

Parameters: `outlierMode` (enum, default `without`, one of `without`, `with`).

Source: manifest `model-34404a0ff6b5.js`; view `visualization-8b88631eb6b3.js` → `MeanVsMedianVisualization`.

#### Mediation indirect effect: `c = c^{\prime} + a \times b`

Path coefficient {a}, predictor {predictor} to mediator {mediator}

Type `MEDIATION_INDIRECT_EFFECT` · manifest v1 · formula `c = c^{\prime} + a \times b`.

Parameters: `a` (number, default `0.6`, range -1 to 1); `b` (number, default `0.5`, range -1 to 1); `directEffect` (number, default `0.2`, range -1 to 1).

Source: manifest `type-e52ae9a5f679.js`; view `visualization-5a8a53570317.js` → `MediationIndirectEffectVisualization`.

#### Meiosis

Type `MEIOSIS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e066341b3d6e.js` → `MeiosisVisualization`.

#### Meiosis nondisjunction

Type `MEIOSIS_NONDISJUNCTION` · manifest v1.

Parameters: `errorDivision` (enum, default `meiosis-one`, one of `meiosis-one`, `meiosis-two`).

Source: manifest `model-265ef64a42f0.js`; view `visualization-f4abdb5f76b7.js` → `MeiosisNondisjunctionVisualization`.

#### Memory hierarchy

Level where the requested value is found

Type `MEMORY_HIERARCHY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-4fbda75f96d2.js` → `Visualization`.

#### Menstrual cycle fertilization

No implantation

Type `MENSTRUAL_CYCLE_FERTILIZATION` · manifest v1.

Parameters: `day` (integer, default `1`, range 1 to 28); `outcome` (enum, default `noImplantation`, one of `noImplantation`, `successfulImplantation`).

Source: manifest `model-6d9c94a4186b.js`; view `visualization-74341f0b21d1.js` → `MenstrualCycleFertilizationVisualization`.

#### Merge sort

Input length

Type `MERGE_SORT` · manifest v4.

Parameters: `value1` (integer, default `38`, range 1 to 99); `value2` (integer, default `12`, range 1 to 99); `value3` (integer, default `27`, range 1 to 99); `value4` (integer, default `43`, range 1 to 99); `value5` (integer, default `9`, range 1 to 99); `value6` (integer, default `31`, range 1 to 99); `value7` (integer, default `18`, range 1 to 99); `value8` (integer, default `25`, range 1 to 99).

Source: manifest `model-1a2ca3b0dc37.js`; view `visualization-cf4be68767a7.js` → `MergeSortVisualization`.

#### Meta analysis

Focal study effect estimate

Type `META_ANALYSIS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ade0dd6efb20.js` → `MetaAnalysisVisualization`.

#### Meta analysis forest weights

Type `META_ANALYSIS_FOREST_WEIGHTS` · manifest v1.

Parameters: `effect1` (number, default `-0.35`, range -0.8 to 0.8); `effect2` (number, default `-0.08`, range -0.8 to 0.8); `effect3` (number, default `0.18`, range -0.8 to 0.8); `effect4` (number, default `0.42`, range -0.8 to 0.8); `effect5` (number, default `0.1`, range -0.8 to 0.8); `weight1` (number, default `5`, range 2 to 24); `weight2` (number, default `12`, range 2 to 24); `weight3` (number, default `8`, range 2 to 24); `weight4` (number, default `18`, range 2 to 24); `weight5` (number, default `10`, range 2 to 24).

Source: manifest `type-72e940cb9aa1.js`; view `visualization-fc4296429e34.js` → `MetaAnalysisForestWeightsVisualization`.

#### Metal reactivity series

Type `METAL_REACTIVITY_SERIES` · manifest v3.

Parameters: `initial_solid_metal` (enum, default `zinc`, one of `magnesium`, `zinc`, `iron`, `copper`, `silver`); `initial_aqueous_metal` (enum, default `copper`, one of `magnesium`, `zinc`, `iron`, `copper`, `silver`).

Source: manifest `model-71af2c81ea03.js`; view `visualization-40edce330535.js` → `MetalReactivitySeriesVisualization`.

#### Metallic bonding

Type `METALLIC_BONDING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-262d4402cf30.js` → `Visualization`.

#### Metric distance

Type `METRIC_DISTANCE` · manifest v1.

Parameters: `lengthCm` (number, default `32`, range 10 to 50); `unit` (enum, default `cm`, one of `mm`, `cm`, `m`, `km`).

Source: manifest `type-aa70f27546d0.js`; view `visualization-eb819b600e36.js` → `MetricDistanceVisualization`.

#### Mhc i vs mhc ii presentation

Antigen-presentation pathway

Type `MHC_I_VS_MHC_II_PRESENTATION` · manifest v1.

Parameters: `initial_pathway` (enum, default `MHC I (endogenous)`, one of `MHC I (endogenous)`, `MHC II (exogenous)`).

Source: manifest `model-d908b4b52347.js`; view `visualization-b5ff056f0636.js` → `MhcPresentationVisualization`.

#### Michaelis menten dynamics

Type `MICHAELIS_MENTEN_DYNAMICS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-12b99aae9409.js` → `MichaelisMentenDynamicsVisualization`.

#### Microbial tolerance curve

Microbial temperature group

Type `MICROBIAL_TOLERANCE_CURVE` · manifest v3.

Parameters: `microbial_group` (enum, default `mesophile`, one of `psychrophile`, `mesophile`, `thermophile`, `hyperthermophile`); `temperature_c` (number, default `37`, range -10 to 110).

Source: manifest `model-28116a0d525d.js`; view `visualization-90e2eb2380aa.js` → `MicrobialToleranceCurveVisualization`.

#### Microphone polar patterns

Polar pattern

Type `MICROPHONE_POLAR_PATTERNS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-9dd59efb5d47.js` → `Visualization`.

#### Midpoint formula

Type `MIDPOINT_FORMULA`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b264d6914546.js` → `MidpointFormulaVisualization`.

#### Minimum wage

Type `MINIMUM_WAGE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-5156bf3fe64c.js` → `MinimumWageVisualization`.

#### Minor scale formula

Choose a tonic for the natural minor scale

Type `MINOR_SCALE_FORMULA`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-66fd155cdd26.js` → `Visualization`.

#### Mirror equation: `\frac{1}{f} = \frac{1}{u} + \frac{1}{v}`

Type `MIRROR_EQUATION` · manifest v4 · formula `\frac{1}{f} = \frac{1}{u} + \frac{1}{v}`, also `\frac{1}{f} = \frac{1}{a} + \frac{1}{b}`, `1/f=1/v+1/u`, `1/f=1/b+1/a`, `1/u+1/v=1/f`, `1/v+1/u=1/f`, `1/a+1/b=1/f`, `1/b+1/a=1/f`.

Parameters: `objectDistance` (number, default `28`, range 0.01 to 10000); `focalLength` (number, default `14`, range -10000 to 10000).

Source: manifest `type-763c6e0ad6c9.js`; view `visualization-f5db55face8b.js` → `MirrorEquationVisualization`.

#### Mitosis

Type `MITOSIS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ba98595a2557.js` → `MitosisVisualization`.

#### Mixed numbers

Type `MIXED_NUMBERS` · manifest v2.

Parameters: `numerator` (integer, default `23`, range 7 to 35).

Source: manifest `model-6ab8da229be6.js`; view `visualization-7170618c43c5.js` → `MixedNumbersVisualization`.

#### Mixing solutions: `C_{\mathrm{mix}}=\frac{C_1V_1+C_2V_2}{V_1+V_2}`

Type `MIXING_SOLUTIONS` · manifest v2 · formula `C_{\mathrm{mix}}=\frac{C_1V_1+C_2V_2}{V_1+V_2}`.

Parameters: `solution1VolumeLiters` (number, default `0.8`, range 0.01 to 1000); `solution1ConcentrationMolesPerLiter` (number, default `2`, range 0 to 20); `solution2VolumeLiters` (number, default `1.2`, range 0.01 to 1000); `solution2ConcentrationMolesPerLiter` (number, default `0.5`, range 0 to 20).

Source: manifest `type-cbd0267ff3a9.js`; view `visualization-bc834888c05b.js` → `MixingSolutionsVisualization`.

#### Molarity moles per liter

Type `MOLARITY_MOLES_PER_LITER`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2738dca3bb3c.js` → `MolarityMolesPerLiterVisualization`.

#### Mole avogadro number visual

Amount in moles

Type `MOLE_AVOGADRO_NUMBER_VISUAL` · manifest v1.

Parameters: `substance` (enum, default `copper`, one of `carbon`, `copper`, `water`); `initial_moles` (number, default `1`, range 0.25 to 5).

Source: manifest `type-bd9c85267933.js`; view `visualization-d7d789ce55cc.js` → `Visualization`.

#### Molecular polarity

Select a molecule comparison

Type `MOLECULAR_POLARITY` · manifest v2.

Parameters: `molecule` (enum, default `H2O`, one of `CO2`, `H2O`, `BF3`, `NH3`, `CCl4`, `CH3Cl`).

Source: manifest `type-8376aae4ceec.js`; view `visualization-45e72b61383e.js` → `Visualization`.

#### Momentum: `p = mv`

Type `MOMENTUM` · manifest v2 · formula `p = mv`, also `v = p/m`, `p=vm`, `mv=p`, `vm=p`, `m=p/v`.

Parameters: `m1` (number, default `4`, range 0.01 to 10000); `m2` (number, default `4`, range 0.01 to 10000); `v` (number, default `6`, range 0 to 10000).

Source: manifest `type-85baef7164cd.js`; view `visualization-29bfda115a0a.js` → `MomentumVisualization`.

#### Monetary policy

Type `MONETARY_POLICY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-9989c33e9aa5.js` → `Visualization`.

#### Money market

Type `MONEY_MARKET`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-8b845d111d18.js` → `MoneyMarketVisualization`.

#### Monopolistic competition

Type `MONOPOLISTIC_COMPETITION` · manifest v3.

Parameters: `entry_progress` (number, default `100`, range 0 to 100).

Source: manifest `type-1d713bfd423d.js`; view `visualization-296cf509d637.js` → `MonopolisticCompetitionVisualization`.

#### Monopoly inefficiency

Highlighted benchmark

Type `MONOPOLY_INEFFICIENCY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-51da2fc29fa4.js` → `MonopolyInefficiencyVisualization`.

#### Monopoly pricing

Type `MONOPOLY_PRICING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-54f7748ead7f.js` → `MonopolyProfitVisualization`.

#### Monopsony labor market power

Monopsony labor market graph. Monopsony employment is {lm} and wage is {wm}; competitive employment is {lc} and wage is {wc}.

Type `MONOPSONY_LABOR_MARKET_POWER`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-8ea88b5a23bf.js` → `MonopsonyLaborMarketPowerVisualization`.

#### Moon phases

Type `MOON_PHASES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-952ad907a7f4.js` → `MoonPhasesVisualization`.

#### Mosaic plot

Type `MOSAIC_PLOT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-312cff367ca4.js` → `Visualization`.

#### Mrna translation

Type `MRNA_TRANSLATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-cd31057b1681.js` → `MrnaTranslationVisualization`.

#### Multiplication as repeated addition

Type `MULTIPLICATION_AS_REPEATED_ADDITION` · manifest v2.

Parameters: `groupCount` (integer, default `4`, range 1 to 6); `itemsPerGroup` (integer, default `3`, range 1 to 6).

Source: manifest `model-5e0ebac94978.js`; view `visualization-153158bb197b.js` → `Visualization`.

#### Musical harmonic series

Selected partial

Type `MUSICAL_HARMONIC_SERIES` · manifest v3.

Parameters: `fundamental_frequency_hz` (number, default `220`, range 20 to 2000).

Source: manifest `type-6bf72910493c.js`; view `visualization-32d4b5ab8498.js` → `Visualization`.

#### Musical interval chart

Interval number

Type `MUSICAL_INTERVAL_CHART` · manifest v4.

Parameters: `lower_note` (enum, default `C`, one of `C`, `C-sharp`, `D-flat`, `D`, `E-flat`, `E`, `F`, `F-sharp`, `G-flat`, `G`, `A-flat`, `A`, `B-flat`, `B`).

Source: manifest `type-d4074e9cd37d.js`; view `visualization-388bc57751b1.js` → `Visualization`.

#### Mutation types

Type `MUTATION_TYPES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f85759478804.js` → `MutationTypesVisualization`.

#### Myopia

Object distance from the eye

Type `MYOPIA` · manifest v2.

Parameters: `objectDistanceMeters` (number, default `6`, range 0.25 to 6).

Source: manifest `type-d92a49fbb130.js`; view `visualization-38d2d04d3521.js` → `MyopiaVisualization`.

#### Natural monopoly

Choose fair-return pricing

Type `NATURAL_MONOPOLY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-bba58a266f85.js` → `NaturalMonopolyVisualization`.

#### Natural selection allele frequency

Type `NATURAL_SELECTION_ALLELE_FREQUENCY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b0e432889bf9.js` → `NaturalSelectionAlleleFrequencyVisualization`.

#### Negative feedback loop

Negative-feedback stage

Type `NEGATIVE_FEEDBACK_LOOP` · manifest v1.

Parameters: `example` (enum, default `body_temperature`, one of `body_temperature`, `blood_glucose`, `thermostat`); `initial_deviation` (enum, default `above`, one of `above`, `below`).

Source: manifest `model-66d4b6ae060b.js`; view `visualization-5e7b5572d07a.js` → `NegativeFeedbackVisualization`.

#### Nephron

Filtrate pathway stage

Type `NEPHRON`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-865887ba710e.js` → `NephronVisualization`.

#### Nernst equation: `E_{\mathrm{cell}}=E^\circ_{\mathrm{cell}}-\frac{0.0592\,\mathrm{V}}{n}\log_{10}Q`

log ten Q

Type `NERNST_EQUATION` · manifest v3 · formula `E_{\mathrm{cell}}=E^\circ_{\mathrm{cell}}-\frac{0.0592\,\mathrm{V}}{n}\log_{10}Q`.

Parameters: `standard_cell_potential_v` (number, default `1.1`, range 0.1 to 1.3); `transferred_electrons` (integer, default `2`, range 1 to 4).

Source: manifest `model-37f1f0ea4383.js`; view `visualization-760f947c8129.js` → `NernstEquationVisualization`.

#### Net ionic equations

Choose an aqueous reaction

Type `NET_IONIC_EQUATIONS` · manifest v2.

Parameters: `reaction_example` (enum, default `silver-chloride-precipitation`, one of `silver-chloride-precipitation`, `barium-sulfate-precipitation`, `strong-acid-base-neutralization`).

Source: manifest `model-1cc997c09d9b.js`; view `visualization-9e5ddb18d9c2.js` → `Visualization`.

#### Network fault tolerance

Packet delivery from A to B

Type `NETWORK_FAULT_TOLERANCE` · manifest v2.

Parameters: `topology` (enum, default `ring`, one of `ring`, `mesh`, `star`, `tree`).

Source: manifest `model-cf3822ac6f6a.js`; view `visualization-29230b0a0a0f.js` → `NetworkFaultToleranceVisualization`.

#### Newman projections

Molecule

Type `NEWMAN_PROJECTIONS` · manifest v2.

Parameters: `molecule` (enum, default `butane`, one of `ethane`, `butane`).

Source: manifest `model-5e45c222a8d6.js`; view `visualization-5719051fc9c7.js` → `NewmanProjectionVisualization`.

#### Newton first law

Type `NEWTON_FIRST_LAW`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-357446d79fd4.js` → `NewtonFirstLawVisualization`.

#### Newton second law: `F_{\mathrm{net}} = ma`

Type `NEWTON_SECOND_LAW` · manifest v3 · formula `F_{\mathrm{net}} = ma`, also `F=ma`, `a=F/m`, `m=F/a`.

Parameters: `netForceNewtons` (number, default `8`, range 2 to 12); `massKilograms` (number, default `2`, range 1 to 4).

Source: manifest `type-5028a1c12442.js`; view `visualization-918a7c5116a1.js` → `NewtonSecondLawVisualization`.

#### Newton third law

Type `NEWTON_THIRD_LAW`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-854917b37695.js` → `NewtonThirdLawVisualization`.

#### Newtons gravitation law

Type `NEWTONS_GRAVITATION_LAW`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-64eea4a00e3e.js` → `NewtonsGravitationLawVisualization`.

#### Nitrogen cycle

Nitrogen-cycle process

Type `NITROGEN_CYCLE` · manifest v2.

Parameters: `focus_process` (enum, default `whole cycle`, one of `whole cycle`, `fixation`, `assimilation and food web`, `ammonification`, `nitrification`, `denitrification`).

Source: manifest `model-4ade1fb3e1f8.js`; view `visualization-590db4db76df.js` → `NitrogenCycleVisualization`.

#### Normal approximation to binomial

Integer success count k

Type `NORMAL_APPROXIMATION_TO_BINOMIAL` · manifest v3.

Parameters: `trials` (integer, default `40`, range 10 to 80); `success_probability` (number, default `0.5`, range 0.02 to 0.98); `success_count` (integer, default `20`, range 0 to 80); `event` (enum, default `at_most`, one of `at_most`, `at_least`, `exactly`).

Source: manifest `model-dff7e5b52187.js`; view `visualization-7e0a06aee719.js` → `NormalApproximationVisualization`.

#### Nuclear decay modes

{mode}: parent {parentMass} {parentSymbol} becomes daughter {daughterMass} {daughterSymbol}; {radiation}. Mass number changes by {massChange}, atomic number by {atomicChange}, protons by {protonChange}, and neutrons by {neutronChange}.

Type `NUCLEAR_DECAY_MODES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2fb97b621cd4.js` → `Visualization`.

#### Nuclear fission

Fission-chain outcome

Type `NUCLEAR_FISSION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ef922dcab48a.js` → `Visualization`.

#### Nuclear fusion

Fusion reaction stage

Type `NUCLEAR_FUSION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-7e9ad7f419ad.js` → `Visualization`.

#### Nuclear power plant

Type `NUCLEAR_POWER_PLANT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-61b6c610c0fb.js` → `Visualization`.

#### Nucleotides dna and rna

Select DNA or RNA

Type `NUCLEOTIDES_DNA_AND_RNA`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-76ff4b4f40f3.js` → `Visualization`.

#### Obtuse triangle

Type `OBTUSE_TRIANGLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-3d84e1a469b6.js` → `ObtuseTriangleVisualization`.

#### Ocean acidification

Atmospheric carbon dioxide

Type `OCEAN_ACIDIFICATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-18ce896864da.js` → `OceanAcidificationVisualization`.

#### Ogive

Cumulative-frequency graph for {total} grouped rent observations. The current class from {classLower} to {classUpper} adds {frequencyCount, plural, one {{frequency} observation} other {{frequency} observations}}, so the curve {slope}. Below {threshold}, about {countCount, plural, one {{count} observation} other {{count} observations}} or {percent} accumulate. At {percentile}, the estimated rent is {value}. Two empty classes keep the curve level near the top.

Type `OGIVE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f7c0d441ad16.js` → `OgiveVisualization`.

#### Ohms law: `I = \frac{V}{R}`

Type `OHMS_LAW` · manifest v3 · formula `I = \frac{V}{R}`, also `V = IR`, `V = I \cdot R`, `V = I \times R`, `\Delta V = IR`, `u = ri`, `v=ri`, `ir=v`, `ri=v`, `i=\Delta V/R`, `i=(1/r)v`, `i=v(1/r)`, `i=1/r(v)`, `r=v/i`, `r=\Delta V/i`, `ri=u`, `i=u/r`, `i=(1/r)u`, `i=u(1/r)`, `i=1/r(u)`, `r=u/i`, `i=(v-v)/r`, `(v-v)/r=i`, `r=(v-v)/i`, `(v-v)/i=r`.

Parameters: `voltage` (number, default `12`, range 0 to 1000); `resistance` (number, default `6`, range 0.1 to 100000).

Source: manifest `type-4b769e1efbb8.js`; view `visualization-247c124a5d72.js` → `OhmsLawVisualization`.

#### Oil spill fate

Elapsed time after spill

Type `OIL_SPILL_FATE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a6a275fa1b47.js` → `OilSpillFateVisualization`.

#### Okuns law

Output gap relative to potential output

Type `OKUNS_LAW`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-aacfef2f03dc.js` → `OkunsLawVisualization`.

#### One sample t test: `t = \frac{\bar{x}-\mu_0}{s/\sqrt{n}}`

Observed sample mean

Type `ONE_SAMPLE_T_TEST` · manifest v3 · formula `t = \frac{\bar{x}-\mu_0}{s/\sqrt{n}}`.

Parameters: `hypothesized_mean` (number, default `50`, range 0 to 100); `sample_mean` (number, default `54`, range 0 to 100); `sample_standard_deviation` (number, default `10`, range 0.1 to 100); `sample_size` (integer, default `16`, range 3 to 100); `alternative` (enum, default `two-sided`, one of `two-sided`, `greater`, `less`); `significance_level` (number, default `0.05`, range 0.001 to 0.2).

Source: manifest `model-bc3413504a24.js`; view `visualization-cc685c896334.js` → `OneSampleTTestVisualization`.

#### Operant conditioning

Type `OPERANT_CONDITIONING` · manifest v1.

Parameters: `behaviorEffect` (enum, default `more_likely`, one of `more_likely`, `less_likely`); `stimulusChange` (enum, default `added`, one of `added`, `removed`).

Source: manifest `model-68a88869b001.js`; view `visualization-a45ad5d99e7a.js` → `OperantConditioningVisualization`.

#### Orbital shapes

Select an atomic subshell

Type `ORBITAL_SHAPES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-70073f8498e4.js` → `Visualization`.

#### Orchestra seating

Type `ORCHESTRA_SEATING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2911fc33b339.js` → `Visualization`.

#### Osmosis

Type `OSMOSIS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-63998deddb00.js` → `OsmosisVisualization`.

#### Osmotic pressure: `\pi = i c R T`

Solute concentration

Type `OSMOTIC_PRESSURE` · manifest v3 · formula `\pi = i c R T`.

Parameters: `solute_concentration_molar` (number, default `0.2`, range 0.05 to 0.5); `vant_hoff_factor` (number, default `2`, range 1 to 3); `temperature_kelvin` (number, default `298`, range 273 to 323).

Source: manifest `type-3a57bdeab4d8.js`; view `visualization-b42eb993520b.js` → `Visualization`.

#### Outlier leverage influence

Choose a starting regression case

Type `OUTLIER_LEVERAGE_INFLUENCE` · manifest v3.

Parameters: `initial_case` (enum, default `influential`, one of `central-outlier`, `aligned-high-leverage`, `influential`).

Source: manifest `type-d42397bb5e22.js`; view `visualization-5afcc816c190.js` → `Visualization`.

#### Oxygen sag curve

Oxygen-sag plot. Remaining biochemical oxygen demand falls downstream. Dissolved oxygen falls to {minimumCount, plural, one {{minimum} milligram per liter} other {{minimum} milligrams per liter}} after {timeCount, plural, one {{time} day} other {{time} days}}, then recovers toward the {saturation} milligrams per liter saturation reference. At the critical minimum, oxygen deficit is {deficitCount, plural, one {{deficit} milligram per liter} other {{deficit} milligrams per liter}} and deoxygenation equals reaeration.

Type `OXYGEN_SAG_CURVE` · manifest v4.

Parameters: `initial_ultimate_bod_mg_l` (number, default `9`, range 4 to 14); `initial_oxygen_deficit_mg_l` (number, default `0.25`, range 0 to 0.5); `deoxygenation_rate_per_day` (number, default `0.25`, range 0.15 to 0.35); `reaeration_rate_per_day` (number, default `0.75`, range 0.35 to 1.15).

Source: manifest `type-523f134bfeb2.js`; view `visualization-a6ec6405d82f.js` → `Visualization`.

#### P series threshold: `\sum_{n=1}^{\infty}\frac{1}{n^p}`

Exponent p

Type `P_SERIES_THRESHOLD` · manifest v3 · formula `\sum_{n=1}^{\infty}\frac{1}{n^p}`.

Parameters: `p` (number, default `1`, range 0.6 to 1.4); `termCount` (integer, default `12`, range 4 to 30).

Source: manifest `type-ede084b98a92.js`; view `visualization-3c0cd061cb0d.js` → `PSeriesThresholdVisualization`.

#### Paired t test

Common after-minus-before change

Type `PAIRED_T_TEST` · manifest v4.

Parameters: `number_of_pairs` (integer, default `10`, range 4 to 16); `alternative` (enum, default `two-sided`, one of `two-sided`, `greater`, `less`).

Source: manifest `model-a8a79b39391c.js`; view `visualization-fbcb30cfa4f6.js` → `PairedTTestVisualization`.

#### Parallel line

{lineName} crosses the y-axis at {intercept}.

Type `PARALLEL_LINE` · manifest v2.

Parameters: `slope` (number, default `0.6`, range -1 to 1); `referenceIntercept` (number, default `0`, range -4 to 4); `comparisonIntercept` (number, default `3`, range -4 to 4).

Source: manifest `type-5ace481a4856.js`; view `visualization-f965b49115f7.js` → `ParallelLineVisualization`.

#### Particulate matter size

Type `PARTICULATE_MATTER_SIZE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-d5e6c6d08bc7.js` → `ParticulateMatterSizeVisualization`.

#### Pascals law hydraulics: `p = \frac{F}{A}`

Input force

Type `PASCALS_LAW_HYDRAULICS` · manifest v2 · formula `p = \frac{F}{A}`.

Parameters: `inputForceNewtons` (number, default `100`, range 20 to 200); `inputAreaSquareCentimeters` (number, default `10`, range 5 to 25); `outputAreaSquareCentimeters` (number, default `50`, range 25 to 100).

Source: manifest `type-9d02b768e9bf.js`; view `visualization-281ed98b58b0.js` → `PascalsLawHydraulicsVisualization`.

#### Pcr cycle

Type `PCR_CYCLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-c4027be107b1.js` → `PcrCycleVisualization`.

#### Pedigree

Inheritance example

Type `PEDIGREE` · manifest v3.

Parameters: `inheritance_pattern` (enum, default `autosomal-dominant`, one of `autosomal-dominant`, `autosomal-recessive`, `x-linked-recessive`).

Source: manifest `model-a39f1b9e2e01.js`; view `visualization-80343da9f33c.js` → `PedigreeVisualization`.

#### Percent part whole proportion

Type `PERCENT_PART_WHOLE_PROPORTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b0fc15f0f60e.js` → `PercentPartWholeProportionVisualization`.

#### Perfect competition

Type `PERFECT_COMPETITION` · manifest v6.

Parameters: `adjustment` (enum, default `profit_entry`, one of `profit_entry`, `loss_exit`).

Source: manifest `model-3deda9c55881.js`; view `visualization-b4a46f81c642.js` → `LongRunCompetitiveEquilibriumVisualization`.

#### Perfect competition market firm

Type `PERFECT_COMPETITION_MARKET_FIRM`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-8dcb8f891e39.js` → `PerfectCompetitionMarketFirmVisualization`.

#### Period frequency relation: `f = \frac{1}{T}`

Type `PERIOD_FREQUENCY_RELATION` · manifest v2 · formula `f = \frac{1}{T}`, also `T = \frac{1}{f}`, `T = 1 / f`, `1/t=f`, `1/f=t`, `t=2pi/omega`, `2pi/omega=t`, `tau=60/nz`, `60/nz=tau`.

Parameters: `period` (number, default `2`, range 0.01 to 1000).

Source: manifest `type-af2e2029147a.js`; view `visualization-85db6d3212e0.js` → `PeriodFrequencyRelationVisualization`.

#### Periodic table explorer

Type `PERIODIC_TABLE_EXPLORER`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-364e516790cc.js` → `PeriodicTableVisualization`.

#### Periodic trends

Type `PERIODIC_TRENDS` · manifest v2.

Parameters: `initial_trend` (enum, default `atomic radius`, one of `atomic radius`, `first ionization energy`, `electronegativity`).

Source: manifest `type-5d4a85edaa4f.js`; view `visualization-63c685f89d76.js` → `Visualization`.

#### Permutation formula

Type `PERMUTATION_FORMULA` · manifest v3.

Parameters: `n` (integer, default `6`, range 4 to 8); `r` (integer, default `3`, range 2 to 4).

Source: manifest `type-1af4bc023ce6.js`; view `visualization-fa63f76873c4.js` → `PermutationFormulaVisualization`.

#### Permutations vs combinations

Type `PERMUTATIONS_VS_COMBINATIONS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e4f11bdb3b12.js` → `PermutationsVsCombinationsVisualization`.

#### Perpendicular line

Type `PERPENDICULAR_LINE` · manifest v4.

Parameters: `slope` (number, default `2`, range -10000 to 10000); `intercept` (number, default `1`, range -10000 to 10000); `perpendicularIntercept` (number, default `-2`, range -10000 to 10000).

Source: manifest `type-edfc78ae68b7.js`; view `visualization-81e88913e03e.js` → `PerpendicularLineVisualization`.

#### Pesticide treadmill

Pesticide treadmill stage

Type `PESTICIDE_TREADMILL`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-7930c6b824bc.js` → `PesticideTreadmillVisualization`.

#### Ph from concentration: `\mathrm{pH}=-\log_{10}([\mathrm{H_3O^+}])`

Hydronium concentration in moles per liter

Type `PH_FROM_CONCENTRATION` · manifest v2 · formula `\mathrm{pH}=-\log_{10}([\mathrm{H_3O^+}])`.

Parameters: `hydronium_concentration_molar` (number, default `1e-7`, range 1e-12 to 0.01).

Source: manifest `type-5afefdccef0f.js`; view `visualization-ad9dd517542b.js` → `PhFromConcentrationVisualization`.

#### Pharmacokinetic curve

Type `PHARMACOKINETIC_CURVE` · manifest v4.

Parameters: `dose_mg` (number, default `240`, range 80 to 400); `elimination_half_life_hours` (number, default `6`, range 2 to 10); `minimum_effective_concentration` (number, default `1.5`, range 0.8 to 2.5); `minimum_toxic_concentration` (number, default `5.5`, range 4 to 8).

Source: manifest `type-a0444b690340.js`; view `visualization-d085f4e56d1d.js` → `PharmacokineticCurveVisualization`.

#### Phase change cycle

Phase change

Type `PHASE_CHANGE_CYCLE` · manifest v2.

Parameters: `initial_transition` (enum, default `melting`, one of `melting`, `freezing`, `vaporization`, `condensation`, `sublimation`, `deposition`).

Source: manifest `model-f0617ef38ba2.js`; view `visualization-71c74e68c959.js` → `PhaseChangeCycleVisualization`.

#### Phase diagram

Type `PHASE_DIAGRAM`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-df6b5363c00a.js` → `PhaseDiagramVisualization`.

#### Phillips curve

Aggregate demand strength

Type `PHILLIPS_CURVE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-db5cc4198ebe.js` → `PhillipsCurveVisualization`.

#### Phillips curve shifts

Type `PHILLIPS_CURVE_SHIFTS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-11840a2d81a0.js` → `PhillipsCurveShiftsVisualization`.

#### Phosphorus cycle

Phosphorus-cycle process

Type `PHOSPHORUS_CYCLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-90e6b8826a76.js` → `PhosphorusCycleVisualization`.

#### Photochemical smog

Time of day

Type `PHOTOCHEMICAL_SMOG`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f92006fff8e4.js` → `PhotochemicalSmogVisualization`.

#### Photoelectric energy balance: `hf = \phi + K_{\max}`

Light frequency

Type `PHOTOELECTRIC_ENERGY_BALANCE` · manifest v1 · formula `hf = \phi + K_{\max}`.

Parameters: `frequencyTimes10To14Hertz` (number, default `8`, range 3 to 15); `intensityPercent` (number, default `50`, range 10 to 100); `workFunctionElectronVolts` (number, default `2.3`, range 1.5 to 6).

Source: manifest `type-389cfab21292.js`; view `visualization-7499624c77be.js` → `PhotoelectricEnergyBalanceVisualization`.

#### Photoelectron spectrum

Select an element

Type `PHOTOELECTRON_SPECTRUM`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e6f32620777d.js` → `Visualization`.

#### Photosynthesis

{label} value

Type `PHOTOSYNTHESIS` · manifest v4.

Parameters: `lightIntensity` (enum, default `low`, one of `low`, `medium`, `high`); `carbonDioxide` (enum, default `low`, one of `low`, `medium`, `high`); `water` (enum, default `low`, one of `low`, `medium`, `high`).

Source: manifest `type-b4bcce60d760.js`; view `visualization-7cbc9abe92a8.js` → `PhotosynthesisVisualization`.

#### Photosynthesis overview: `6CO_2 + 6H_2O + \text{light energy} \rightarrow C_6H_{12}O_6 + 6O_2`

Photosynthesis stage focus

Type `PHOTOSYNTHESIS_OVERVIEW` · manifest v1 · formula `6CO_2 + 6H_2O + \text{light energy} \rightarrow C_6H_{12}O_6 + 6O_2`.

Parameters: `initial_focus` (enum, default `whole process`, one of `whole process`, `light reactions`, `Calvin cycle`).

Source: manifest `model-7354fd8cc5a6.js`; view `visualization-ba382e408f5a.js` → `PhotosynthesisOverviewVisualization`.

#### Photosynthetic pigment spectrum

Visible-light wavelength in nanometres

Type `PHOTOSYNTHETIC_PIGMENT_SPECTRUM`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-77852f26bac5.js` → `PhotosyntheticPigmentSpectrumVisualization`.

#### Phototropism

Phototropism response stage

Type `PHOTOTROPISM`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-7c9b1967af04.js` → `Visualization`.

#### Phylogenetic tree

{first} and {second}

Type `PHYLOGENETIC_TREE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-7cf1209756ff.js` → `Visualization`.

#### Physical vs chemical process

Examples

Type `PHYSICAL_VS_CHEMICAL_PROCESS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-bb03f5080542.js` → `Visualization`.

#### Piano chord chart

Chord root family

Type `PIANO_CHORD_CHART` · manifest v2.

Parameters: `root_note` (enum, default `C`, one of `C`, `Db`, `D`, `Eb`, `E`, `F`, `F#`, `G`, `Ab`, `A`, `Bb`, `B`); `quality` (enum, default `major`, one of `major`, `minor`).

Source: manifest `type-f409ad2953b1.js`; view `visualization-8fbb5af781e1.js` → `Visualization`.

#### Piano keyboard note names

Selected piano key

Type `PIANO_KEYBOARD_NOTE_NAMES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-67fd5879f948.js` → `Visualization`.

#### Piano roll

Type `PIANO_ROLL`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a1856d734bb6.js` → `PianoRollVisualization`.

#### Place value

Whole number

Type `PLACE_VALUE` · manifest v2.

Parameters: `number` (integer, default `2654`, range 0 to 9999).

Source: manifest `type-3be9f9a369b1.js`; view `visualization-6aa8fc1a365a.js` → `PlaceValueVisualization`.

#### Plant anatomy

Plant organ

Type `PLANT_ANATOMY` · manifest v2.

Parameters: `initial_organ` (enum, default `root`, one of `root`, `stem`, `leaf`); `initial_transport_tissue` (enum, default `xylem`, one of `xylem`, `phloem`).

Source: manifest `type-a2c1e373aef7.js`; view `visualization-4bc5d880f121.js` → `Visualization`.

#### Plant life cycle

Plant life-cycle stage

Type `PLANT_LIFE_CYCLE` · manifest v2.

Parameters: `initial_stage` (enum, default `germination`, one of `germination`, `seedling`, `mature flowering plant`, `pollination`, `seed formation`, `seed dispersal`).

Source: manifest `model-9badbb3726c5.js`; view `visualization-460410b3fa38.js` → `PlantLifeCycleVisualization`.

#### Plant vs animal cell

Type `PLANT_VS_ANIMAL_CELL`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-1cb02e739035.js` → `Visualization`.

#### Plate boundaries

Plate boundary type

Type `PLATE_BOUNDARIES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e4abacaf3b6a.js` → `Visualization`.

#### Point slope line: `y - y_1 = m(x - x_1)`

Type `POINT_SLOPE_LINE` · manifest v2 · formula `y - y_1 = m(x - x_1)`.

Parameters: `x1` (number, default `-3`, range -100 to 100); `y1` (number, default `-2`, range -100 to 100); `slope` (number, default `0.75`, range -20 to 20).

Source: manifest `type-27959fdf7d51.js`; view `visualization-e07154cb7990.js` → `PointSlopeLineVisualization`.

#### Point to plane distance: `d = PH`

Type `POINT_TO_PLANE_DISTANCE` · manifest v2 · formula `d = PH`.

Parameters: `pointX` (number, default `1.5`, range -3 to 3); `pointY` (number, default `4`, range 2 to 5.5); `planeAngleDegrees` (number, default `-10`, range -25 to 25).

Source: manifest `type-96ed8dbb8a85.js`; view `visualization-a5cb597f76c4.js` → `PointToPlaneDistanceVisualization`.

#### Poisson distribution: `P(X=k)=\frac{e^{-\lambda}\lambda^k}{k!}`

Expected events in the interval

Type `POISSON_DISTRIBUTION` · manifest v2 · formula `P(X=k)=\frac{e^{-\lambda}\lambda^k}{k!}`.

Parameters: `lambda` (number, default `5`, range 0.5 to 20); `count` (integer, default `5`, range 0 to 40).

Source: manifest `model-253b6086c636.js`; view `visualization-6c5e4787f441.js` → `PoissonDistributionVisualization`.

#### Polar curves

Type `POLAR_CURVES` · manifest v1.

Parameters: `offset` (number, default `1`, range 0 to 2); `amplitude` (number, default `2`, range 0 to 2).

Source: manifest `model-eb52e6c3fc55.js`; view `visualization-f0e5532df10c.js` → `PolarCurvesVisualization`.

#### Polar double integral

Type `POLAR_DOUBLE_INTEGRAL`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-25d6c56878e8.js` → `PolarDoubleIntegralVisualization`.

#### Polygon interior angle sum: `(n - 2)\times 180^\circ`

Type `POLYGON_INTERIOR_ANGLE_SUM` · manifest v2 · formula `(n - 2)\times 180^\circ`, also `(n - 2) \times 180^\circ`, `S_n = (n - 2) \cdot 180^\circ`, `S_n = (n - 2)(180^\circ)`, `S_n=(n-2)\cdot(180)`, `180^\circ(n-2)`.

Parameters: `n` (number, default `6`, range 3 to 50).

Source: manifest `type-e574ac8a1abb.js`; view `visualization-69aee5710650.js` → `PolygonInteriorAngleSumVisualization`.

#### Polymerization

Alkene monomer

Type `POLYMERIZATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-53e1a9569e61.js` → `Visualization`.

#### Polynomial multiplicity intercepts: `f(x) = k(x-r_1)^{m_1}(x-r_2)^{m_2}`

Type `POLYNOMIAL_MULTIPLICITY_INTERCEPTS` · manifest v2 · formula `f(x) = k(x-r_1)^{m_1}(x-r_2)^{m_2}`.

Parameters: `rootCenter` (number, default `0`, range -2 to 2); `rootSeparation` (number, default `4`, range 1 to 4); `leftRootMultiplicity` (integer, default `2`, range 1 to 3); `rightRootMultiplicity` (integer, default `3`, range 1 to 3).

Source: manifest `model-397adfbb4078.js`; view `visualization-80827407e95d.js` → `PolynomialMultiplicityInterceptsVisualization`.

#### Polyprotic titration

Equivalents of strong base added

Type `POLYPROTIC_TITRATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-eb3409043fd8.js` → `Visualization`.

#### Population density: `D = \frac{P}{A}`

Population

Type `POPULATION_DENSITY` · manifest v2 · formula `D = \frac{P}{A}`.

Parameters: `population` (integer, default `500000`, range 1000 to 1000000); `landAreaSquareKilometers` (number, default `100`, range 5 to 1000).

Source: manifest `model-72ba9b7b6395.js`; view `visualization-56e702acceb6.js` → `PopulationDensityVisualization`.

#### Positive externality

Marginal external benefit

Type `POSITIVE_EXTERNALITY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-da69eda25bed.js` → `PositiveExternalityVisualization`.

#### Positive feedback loop

Feedback example

Type `POSITIVE_FEEDBACK_LOOP` · manifest v2.

Parameters: `example` (enum, default `childbirth`, one of `childbirth`, `ice-albedo`).

Source: manifest `model-1d9447e10398.js`; view `visualization-aa56fb5ab882.js` → `PositiveFeedbackVisualization`.

#### Ppc growth

Type `PPC_GROWTH` · manifest v2.

Parameters: `capacity_change_percent` (number, default `15`, range -40 to 30).

Source: manifest `type-358342ea04f6.js`; view `visualization-617f80b8a45c.js` → `PpcGrowthVisualization`.

#### Ppc opportunity cost

Type `PPC_OPPORTUNITY_COST` · manifest v3.

Parameters: `extraWheat` (number, default `5`, range 0.5 to 6).

Source: manifest `model-7f6fce9d5547.js`; view `visualization-1d7aaf1846c9.js` → `Visualization`.

#### Precipitation reactions

Reactants

Type `PRECIPITATION_REACTIONS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-c6941ec6b14e.js` → `PrecipitationReactionsVisualization`.

#### Predator prey cycle

Predator-prey cycle phase

Type `PREDATOR_PREY_CYCLE` · manifest v3.

Parameters: `population_pair` (enum, default `hare-and-lynx`, one of `hare-and-lynx`, `rabbit-and-fox`, `generic-prey-and-predator`).

Source: manifest `type-3465f183219c.js`; view `visualization-2cf72306c1c4.js` → `PredatorPreyCycleVisualization`.

#### Predator prey dynamics

Starting balance

Type `PREDATOR_PREY_DYNAMICS` · manifest v4.

Parameters: `initial_prey_abundance` (number, default `1.4`, range 0.65 to 1.4); `initial_predator_abundance` (number, default `0.65`, range 0.65 to 1.4).

Source: manifest `model-cec47be50a46.js`; view `visualization-a282fd7e2dd2.js` → `PredatorPreyVisualization`.

#### Presbyopia

Type `PRESBYOPIA` · manifest v3.

Parameters: `condition` (enum, default `presbyopia`, one of `typical`, `presbyopia`); `objectDistanceCentimeters` (number, default `35`, range 25 to 200).

Source: manifest `model-cb61e61a81ef.js`; view `visualization-e929e662ad29.js` → `PresbyopiaVisualization`.

#### Present value discounting

Type `PRESENT_VALUE_DISCOUNTING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ac26ac272767.js` → `PresentValueDiscountingVisualization`.

#### Pressure: `P = \frac{F}{A}`

Type `PRESSURE` · manifest v2 · formula `P = \frac{F}{A}`, also `P = F/A`, `F = PA`, `A = F/P`.

Parameters: `forceNewtons` (number, default `100`, range 0 to 200); `areaSquareMeters` (number, default `2`, range 0.25 to 5).

Source: manifest `type-e210bd3bc009.js`; view `visualization-f8347d2fa095.js` → `PressureVisualization`.

#### Price ceilings and floors

Type `PRICE_CEILINGS_AND_FLOORS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b3801a35a290.js` → `PriceCeilingsAndFloorsVisualization`.

#### Price discrimination

Pricing mode

Type `PRICE_DISCRIMINATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-6eea4fe04ad0.js` → `PriceDiscriminationVisualization`.

#### Primary vs secondary pollutants

Formation pathway

Type `PRIMARY_VS_SECONDARY_POLLUTANTS` · manifest v3.

Parameters: `initial_pathway` (enum, default `photochemical-smog`, one of `photochemical-smog`, `secondary-particles`).

Source: manifest `model-5ba45a3a952c.js`; view `visualization-5af2fb7507f2.js` → `PrimaryVsSecondaryPollutantsVisualization`.

#### Primes

Type `PRIMES` · manifest v2.

Parameters: `number` (integer, default `100`, range 2 to 1000).

Source: manifest `model-24b2fb9cdc75.js`; view `visualization-c567230aa40a.js` → `PrimesVisualization`.

#### Probability intersection

Type `PROBABILITY_INTERSECTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-da4bd198efc8.js` → `ProbabilityIntersectionVisualization`.

#### Probability tree

Choose sampling mode

Type `PROBABILITY_TREE` · manifest v2.

Parameters: `first_outcome_count` (integer, default `3`, range 1 to 12); `second_outcome_count` (integer, default `8`, range 1 to 12); `with_replacement` (boolean, default `false`).

Source: manifest `type-bb80ea70b787.js`; view `visualization-383d5fd7d88d.js` → `ProbabilityTreeVisualization`.

#### Process capability cp cpk

Process mean

Type `PROCESS_CAPABILITY_CP_CPK` · manifest v3.

Parameters: `lower_specification_limit` (number, default `90`, range 80 to 95); `upper_specification_limit` (number, default `110`, range 105 to 120); `process_mean` (number, default `100`, range 80 to 120); `process_standard_deviation` (number, default `2.5`, range 1 to 4).

Source: manifest `model-9f44ebe8bcfd.js`; view `visualization-d9677eac1ca9.js` → `ProcessCapabilityVisualization`.

#### Production function

Type `PRODUCTION_FUNCTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2e20de7f8c55.js` → `ProductionFunctionVisualization`.

#### Production possibilities frontier

Type `PRODUCTION_POSSIBILITIES_FRONTIER` · manifest v5.

Parameters: `wheat` (number, default `4`, range 0 to 9); `computers` (number, default `4`, range 0 to 9).

Source: manifest `type-f06e3a1bfe5a.js`; view `visualization-ade6b0f4cf6d.js` → `Visualization`.

#### Projectile motion

Type `PROJECTILE_MOTION` · manifest v4.

Parameters: `initialSpeedMetersPerSecond` (number, default `18`, range 12 to 25); `launchAngleDegrees` (number, default `45`, range 25 to 65).

Source: manifest `model-7239f4550c95.js`; view `visualization-cdd57dd481d3.js` → `ProjectileMotionVisualization`.

#### Prokaryotic vs eukaryotic cells

Select a cell feature focus

Type `PROKARYOTIC_VS_EUKARYOTIC_CELLS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ccb04b0c6ee8.js` → `Visualization`.

#### Protein denaturation

Environmental stress

Type `PROTEIN_DENATURATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-fbb4ff8da26b.js` → `ProteinDenaturationVisualization`.

#### Protein structure levels

Protein structure level

Type `PROTEIN_STRUCTURE_LEVELS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f226610abaee.js` → `ProteinStructureVisualization`.

#### Proton nmr splitting

Select the number of equivalent neighboring protons

Type `PROTON_NMR_SPLITTING` · manifest v3.

Parameters: `neighbor_count` (enum, default `2`, one of `0`, `1`, `2`, `3`, `4`, `6`).

Source: manifest `type-ec08a0c3755f.js`; view `visualization-184461f1b480.js` → `Visualization`.

#### Pulmonary surfactant and compliance

Lung condition

Type `PULMONARY_SURFACTANT_AND_COMPLIANCE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-9b9cd6c95cc2.js` → `Visualization`.

#### Punnett squares

Type `PUNNETT_SQUARES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-58da526f6efd.js` → `PunnettSquareVisualization`.

#### Pupillary light reflex

Type `PUPILLARY_LIGHT_REFLEX`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2ca6b58dc6c5.js` → `PupillaryLightReflexVisualization`.

#### Pv nrt equation: `PV = nRT`

Type `PV_NRT_EQUATION` · manifest v4 · formula `PV = nRT`, also `P V = n R T`, `P = nRT / V`, `P = \frac{nRT}{V}`, `V = nRT / P`, `V = \frac{nRT}{P}`, `n = PV / RT`, `n = \frac{PV}{RT}`, `T = PV / nR`, `T = \frac{PV}{nR}`, `R = PV / nT`, `R = \frac{PV}{nT}`.

Parameters: `P` (number, default `1`, range 0.01 to 100); `V` (number, default `24`, range 0.01 to 10000); `n` (number, default `1`, range 0.01 to 1000); `T` (number, default `298`, range 1 to 5000); `solveFor` (enum, default `P`, one of `P`, `V`, `n`, `T`).

Source: manifest `type-545469cf1dee.js`; view `visualization-b5884c14b417.js` → `PVNRTVisualization`.

#### Pythagorean theorem: `a^2 + b^2 = c^2`

Type `PYTHAGOREAN_THEOREM` · manifest v4 · formula `a^2 + b^2 = c^2`, also `c^2 = a^2 + b^2`, `c = \sqrt{a^2 + b^2}`, `c = \sqrt{(a^2 + b^2)}`.

Parameters: `a` (number, default `15`, range 0.01 to 10000); `b` (number, default `15`, range 0.01 to 10000).

Source: manifest `type-8d5332dc0d4a.js`; view `visualization-4bec3ca4688f.js` → `PythagoreanVisualization`.

#### Python range for loop

Type `PYTHON_RANGE_FOR_LOOP` · manifest v3.

Parameters: `start` (integer, default `2`, range -4 to 10); `stop` (integer, default `10`, range -4 to 10); `step` (integer, default `2`, range -4 to 4).

Source: manifest `model-5a0d6a0ec95c.js`; view `visualization-794b7f29de3b.js` → `PythonRangeForLoopVisualization`.

#### Q vs k

Q is less than K

Type `Q_VS_K` · manifest v3.

Parameters: `equilibrium_constant` (number, default `1`, range 1e-100 to 1e+100); `initial_reaction_quotient` (number, default `0.1`, range 0 to 1e+101).

Source: manifest `model-aa3adbeb5d62.js`; view `visualization-41fa8af95212.js` → `QVsKVisualization`.

#### Qt prolongation torsades

Corrected QT interval

Type `QT_PROLONGATION_TORSADES` · manifest v2.

Parameters: `qtcMs` (number, default `420`, range 360 to 560).

Source: manifest `type-2cfafbf12fe5.js`; view `visualization-3b71a3b64b89.js` → `QTProlongationV2Visualization`.

#### Quadratic formula: `x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`

Type `QUADRATIC_FORMULA` · manifest v4 · formula `x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`, also `x = (-b \pm \sqrt{b^2 - 4ac})/(2a)`.

Parameters: `a` (number, default `1`, range -5 to 5); `b` (number, default `0`, range -5 to 5); `c` (number, default `-4`, range -5 to 5).

Source: manifest `type-46bd62c7daa0.js`; view `visualization-7b7472c4558c.js` → `QuadraticFormulaVisualization`.

#### Quadratic inequalities: `ax^2 + bx + c > 0`

{operator} zero

Type `QUADRATIC_INEQUALITIES` · manifest v2 · formula `ax^2 + bx + c > 0`.

Parameters: `a` (number, default `1`, range 0.1 to 10); `b` (number, default `-1`, range -20 to 20); `c` (number, default `-6`, range -20 to 20); `operator` (enum, default `>`, one of `>`, `<`, `>=`, `<=`).

Source: manifest `model-dcf2f0fdafb4.js`; view `visualization-1f27d11b0e46.js` → `QuadraticInequalitiesVisualization`.

#### Quadratic vertex form: `y = a(x - h)^2 + k`

Type `QUADRATIC_VERTEX_FORM` · manifest v3 · formula `y = a(x - h)^2 + k`.

Parameters: `h` (number, default `0`, range -5 to 5); `k` (number, default `0`, range -5 to 5).

Source: manifest `model-870129d9ea20.js`; view `visualization-6219c6ca2900.js` → `QuadraticVertexFormVisualization`.

#### Quicksort

Starting arrangement

Type `QUICKSORT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-65c1445dfc7c.js` → `QuicksortVisualization`.

#### Raas and adh

RAAS and ADH causal stage

Type `RAAS_AND_ADH` · manifest v2.

Parameters: `initial_condition` (enum, default `volume loss`, one of `normal`, `volume loss`, `increased osmolality`).

Source: manifest `model-f92e3f01a456.js`; view `visualization-961081da7d68.js` → `Visualization`.

#### Radiation penetration

Shielding stage

Type `RADIATION_PENETRATION` · manifest v2.

Parameters: `initial_shielding` (enum, default `lead-or-concrete`, one of `none`, `paper`, `aluminium-or-plastic`, `lead-or-concrete`).

Source: manifest `type-7a83abf1c6c4.js`; view `visualization-7b909d30f9c4.js` → `RadiationPenetrationVisualization`.

#### Radiometric dating

Type `RADIOMETRIC_DATING` · manifest v4.

Parameters: `isotope_system` (enum, default `carbon-14-to-nitrogen-14`, one of `carbon-14-to-nitrogen-14`, `potassium-40-to-argon-40`, `uranium-238-to-lead-206`).

Source: manifest `model-d7a1e636d00a.js`; view `visualization-14c22908a73d.js` → `RadiometricDatingVisualization`.

#### Rain shadow effect

Type `RAIN_SHADOW_EFFECT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-eae5391c285b.js` → `RainShadowVisualization`.

#### Randomized controlled trial flow

Trial phase

Type `RANDOMIZED_CONTROLLED_TRIAL_FLOW`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b6bc22b4ce0f.js` → `Visualization`.

#### Randomized experiment

Experiment stage

Type `RANDOMIZED_EXPERIMENT` · manifest v2.

Parameters: `experimental_units` (integer, default `16`, range 6 to 30); `treatment_effect` (number, default `8`, range -20 to 20).

Source: manifest `type-b2315d4b532d.js`; view `visualization-da3183f25b98.js` → `RandomizedExperimentVisualization`.

#### Rates and bonds

Type `RATES_AND_BONDS` · manifest v1.

Parameters: `yieldChangePercentagePoints` (number, default `0`, range -3 to 3).

Source: manifest `model-57ce9234be9d.js`; view `visualization-e65c1e9e0fc2.js` → `RatesAndBondsVisualization`.

#### Rational inequality sign chart

Step 1: Find critical values

Type `RATIONAL_INEQUALITY_SIGN_CHART`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-cdeca41d8165.js` → `RationalInequalitySignChartVisualization`.

#### Rational limits at infinity: `\lim_{x\to\pm\infty}\left(f(x)-q(x)\right)=0`

Numerator leading coefficient {variable}

Type `RATIONAL_LIMITS_AT_INFINITY` · manifest v1 · formula `\lim_{x\to\pm\infty}\left(f(x)-q(x)\right)=0`.

Parameters: `numeratorDegree` (integer, default `1`, range 0 to 3); `denominatorDegree` (integer, default `2`, range 1 to 3); `numeratorLeadingCoefficient` (number, default `2`, range 0.5 to 5); `denominatorLeadingCoefficient` (number, default `1`, range 0.5 to 5).

Source: manifest `model-65944a036c44.js`; view `visualization-b556ab5c5b02.js` → `RationalLimitsAtInfinityVisualization`.

#### Reaction order plots

Reaction order

Type `REACTION_ORDER_PLOTS` · manifest v3.

Parameters: `reaction_order` (enum, default `first-order`, one of `zero-order`, `first-order`, `second-order`).

Source: manifest `type-d93f8783cbfc.js`; view `visualization-4b6d7d3e319a.js` → `ReactionOrderPlotsVisualization`.

#### Reaction rate over time

Observed species

Type `REACTION_RATE_OVER_TIME` · manifest v4.

Parameters: `observed_species` (enum, default `reactant`, one of `reactant`, `product`).

Source: manifest `model-501467f4520d.js`; view `visualization-8f11326b323b.js` → `ReactionRateVisualization`.

#### Reaction thermodynamics: `\Delta H = H_{\mathrm{products}} - H_{\mathrm{reactants}}`

Forward activation energy

Type `REACTION_THERMODYNAMICS` · manifest v3 · formula `\Delta H = H_{\mathrm{products}} - H_{\mathrm{reactants}}`.

Parameters: `activationEnergyKilojoulesPerMole` (number, default `90`, range 50 to 150); `enthalpyChangeKilojoulesPerMole` (number, default `-30`, range -60 to 40).

Source: manifest `type-f44192a3e2d7.js`; view `visualization-89219f22d8ce.js` → `ReactionThermodynamicsVisualization`.

#### Reaction type explorer

Type `REACTION_TYPE_EXPLORER`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-341d204da63f.js` → `ReactionTypeExplorerVisualization`.

#### Recrystallization purification

Low cold solubility

Type `RECRYSTALLIZATION_PURIFICATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-189bbe150a94.js` → `RecrystallizationVisualization`.

#### Rectangle area

Type `RECTANGLE_AREA`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ea4cec8aa357.js` → `RectangleAreaVisualization`.

#### Rectangular prism volume

Type `RECTANGULAR_PRISM_VOLUME`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-c8542b59958b.js` → `RectangularPrismVolumeVisualization`.

#### Redox electron transfer

Reaction stage

Type `REDOX_ELECTRON_TRANSFER`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-70252c38b040.js` → `Visualization`.

#### Reflection transformation coordinate plane

Point

Type `REFLECTION_TRANSFORMATION_COORDINATE_PLANE` · manifest v3.

Parameters: `objectMode` (enum, default `triangle`, one of `point`, `triangle`); `reflectionLine` (enum, default `y_equals_x`, one of `x_axis`, `y_axis`, `y_equals_x`, `y_equals_negative_x`); `ax` (number, default `-3.5`, range -5.5 to 5.5); `ay` (number, default `0.25`, range -5.5 to 5.5); `triangleCenterX` (number, default `-2`, range -2 to 2); `triangleCenterY` (number, default `1`, range -2 to 2); `triangleWidth` (number, default `3`, range 1 to 4); `triangleHeight` (number, default `2.5`, range 1 to 4); `triangleRotationDegrees` (number, default `0`, range -90 to 90).

Source: manifest `model-965ba7ea53bb.js`; view `visualization-82be2556ec98.js` → `ReflectionTransformationCoordinatePlaneVisualization`.

#### Reorder point and safety stock

Type `REORDER_POINT_AND_SAFETY_STOCK` · manifest v3.

Parameters: `initialInventory` (number, default `240`, range 220 to 300); `demandRateUnitsPerDay` (number, default `20`, range 20 to 40); `leadTimeDays` (number, default `4`, range 2 to 4); `safetyStock` (number, default `40`, range 20 to 60).

Source: manifest `model-63190570fb43.js`; view `visualization-2f6cb1f08024.js` → `ReorderPointAndSafetyStockVisualization`.

#### Resistors in parallel equivalent: `\frac{1}{R_T} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3}`

Type `RESISTORS_IN_PARALLEL_EQUIVALENT` · manifest v4 · formula `\frac{1}{R_T} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3}`, also `\frac{1}{R_T} = \frac{1}{R_1} + \frac{1}{R_2}`, `\frac{1}{R_{\text{eq}}} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3}`.

Parameters: `r1` (number, default `8`, range 0.1 to 100000); `r2` (number, default `8`, range 0.1 to 100000); `r3` (number, default `8`, range 0.1 to 100000); `voltage` (number, default `12`, range 0 to 1000).

Source: manifest `type-1994a14ca218.js`; view `visualization-5ae8b7909aed.js` → `ResistorsInParallelEquivalentVisualization`.

#### Resistors in series equivalent: `R_{\text{total}} = R_1 + R_2 + \dots`

Type `RESISTORS_IN_SERIES_EQUIVALENT` · manifest v4 · formula `R_{\text{total}} = R_1 + R_2 + \dots`, also `R_{\text{eq}} = R_1 + R_2 + R_3`, `R_T = R_1 + R_2 + R_3`, `R_{eq} = R_1 + R_2 + R_3`.

Parameters: `r1` (number, default `8`, range 0.1 to 100000); `r2` (number, default `8`, range 0.1 to 100000); `r3` (number, default `8`, range 0.1 to 100000); `voltage` (number, default `12`, range 0 to 1000).

Source: manifest `type-ff1e86d5dbe7.js`; view `visualization-2968bcaf5aa9.js` → `ResistorsInSeriesEquivalentVisualization`.

#### Resonance structures

Resonance example

Type `RESONANCE_STRUCTURES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-28741ba4ec50.js` → `Visualization`.

#### Rest value chart

Choose a rest value to compare

Type `REST_VALUE_CHART`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-83b30515bbfe.js` → `Visualization`.

#### Restriction enzyme map

Restriction digest

Type `RESTRICTION_ENZYME_MAP` · manifest v3.

Parameters: `molecule_topology` (enum, default `circular plasmid`, one of `circular plasmid`, `linear DNA`).

Source: manifest `model-6e039b1d844f.js`; view `visualization-c2480e901f06.js` → `Visualization`.

#### Rgb additive mixing

Red channel level

Type `RGB_ADDITIVE_MIXING` · manifest v3.

Parameters: `red` (integer, default `255`, range 0 to 255); `green` (integer, default `255`, range 0 to 255); `blue` (integer, default `255`, range 0 to 255).

Source: manifest `type-8b177dd67695.js`; view `visualization-52f9fc60a6bd.js` → `RgbAdditiveMixingVisualization`.

#### Riemann sums

Type `RIEMANN_SUMS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e773f22e8d52.js` → `IntegrationEstimationVisualization`.

#### Right triangle

Type `RIGHT_TRIANGLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-4770881cc359.js` → `RightTriangleVisualization`.

#### Rna processing

Type `RNA_PROCESSING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-4e5e1df03f2e.js` → `Visualization`.

#### Roc curve

Area under the ROC curve

Type `ROC_CURVE` · manifest v3.

Parameters: `auroc` (number, default `0.75`, range 0.5 to 0.95); `threshold` (number, default `0.5`, range 0 to 1).

Source: manifest `type-c65766b09e91.js`; view `visualization-226bec6c32f6.js` → `RocCurveVisualization`.

#### Rock cycle

Starting material

Type `ROCK_CYCLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-718df332a90e.js` → `RockCycleVisualization`.

#### Rods cones light levels

Type `RODS_CONES_LIGHT_LEVELS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-6b7633d1e4a1.js` → `RodsConesLightLevelsVisualization`.

#### Rolles theorem: `f(a)=f(b)\implies\exists\,c\in(a,b):f'(c)=0`

Type `ROLLES_THEOREM` · manifest v3 · formula `f(a)=f(b)\implies\exists\,c\in(a,b):f'(c)=0`.

Parameters: `endpointY` (number, default `-2`, range -10 to 10); `vertexOffset` (number, default `6`, range -10 to 10).

Source: manifest `model-d7d56680b09d.js`; view `visualization-18be2e886ec5.js` → `RollesTheoremVisualization`.

#### Root power equivalence

Type `ROOT_POWER_EQUIVALENCE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-3306ea057aa2.js` → `RootPowerEquivalenceVisualization`.

#### Rotation transformation coordinate plane

Type `ROTATION_TRANSFORMATION_COORDINATE_PLANE` · manifest v4.

Parameters: `angleDeg` (number, default `90`, range -180 to 180).

Source: manifest `model-50addbd68e43.js`; view `visualization-ab5ad52b8f9e.js` → `RotationTransformationCoordinatePlaneVisualization`.

#### Round robin cpu scheduling

Time quantum

Type `ROUND_ROBIN_CPU_SCHEDULING` · manifest v2.

Parameters: `time_quantum` (integer, default `3`, range 1 to 8); `workload` (enum, default `mixed-bursts`, one of `mixed-bursts`, `one-long-two-short`, `equal-bursts`).

Source: manifest `model-5fdbc0dfab74.js`; view `visualization-3c990cb185bd.js` → `RoundRobinCpuSchedulingVisualization`.

#### Rutherford gold foil experiment

Choose the atomic model

Type `RUTHERFORD_GOLD_FOIL_EXPERIMENT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-132f7ce87e59.js` → `Visualization`.

#### Saltwater intrusion

Type `SALTWATER_INTRUSION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e8f4e1628e6c.js` → `Visualization`.

#### Sample space grid

Type `SAMPLE_SPACE_GRID` · manifest v2.

Parameters: `event` (enum, default `sum equals 7`, one of `sum equals 5`, `sum equals 7`, `sum at least 10`, `matching values`).

Source: manifest `model-f4dbaa3dfc38.js`; view `visualization-ea5beac122d7.js` → `SampleSpaceGridVisualization`.

#### Sample variance

Type `SAMPLE_VARIANCE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ecc11984821f.js` → `SampleVarianceVisualization`.

#### Sampling distribution

Population shape

Type `SAMPLING_DISTRIBUTION` · manifest v3.

Parameters: `population_shape` (enum, default `normal`, one of `normal`, `right-skewed`); `population_mean` (number, default `50`, range -10000 to 10000); `population_standard_deviation` (number, default `12`, range 0.1 to 1000); `sample_size` (integer, default `10`, range 2 to 100).

Source: manifest `model-935d6fe1930e.js`; view `visualization-3db5db4202f9.js` → `SamplingDistributionVisualization`.

#### Sampling without replacement

First-draw branch to inspect

Type `SAMPLING_WITHOUT_REPLACEMENT` · manifest v3.

Parameters: `category_a_count` (integer, default `4`, range 1 to 10); `category_b_count` (integer, default `3`, range 1 to 10).

Source: manifest `type-9a0c50e93ce3.js`; view `visualization-4647ffb39a92.js` → `SamplingWithoutReplacementVisualization`.

#### Sarcomere structure

Type `SARCOMERE_STRUCTURE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-5804a02e2e9a.js` → `SarcomereStructureVisualization`.

#### Saturated vs unsaturated solution

Solid solute added

Type `SATURATED_VS_UNSATURATED_SOLUTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-4f36c6aa44dd.js` → `Visualization`.

#### Scalene triangle

Type `SCALENE_TRIANGLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-9f42a17b8310.js` → `ScaleneTriangleVisualization`.

#### Scientific notation: `a \times 10^n`

Type `SCIENTIFIC_NOTATION` · manifest v2 · formula `a \times 10^n`.

Parameters: `coefficient` (number, default `2.12`, range 1 to 9.99); `exponent` (integer, default `5`, range -9 to 9).

Source: manifest `model-d8a30bda1b33.js`; view `visualization-bec23f9d9724.js` → `ScientificNotationVisualization`.

#### Sea level rise

Observation interval

Type `SEA_LEVEL_RISE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-9aec9a05b363.js` → `Visualization`.

#### Seasons and solar angle

Type `SEASONS_AND_SOLAR_ANGLE` · manifest v3.

Parameters: `latitude_degrees` (number, default `40`, range -80 to 80).

Source: manifest `type-afd9de5814d9.js`; view `visualization-64069f5fb29d.js` → `SeasonsVisualization`.

#### Seed germination

Type `SEED_GERMINATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-71a57919e8de.js` → `SeedGerminationVisualization`.

#### Segment ratio: `AP:PB=m:n`

Type `SEGMENT_RATIO` · manifest v1 · formula `AP:PB=m:n`.

Parameters: `pointAX` (number, default `-6`, range -10000 to 10000); `pointAY` (number, default `-2`, range -10000 to 10000); `segmentLength` (number, default `14.142135623730951`, range 1 to 10000); `segmentAngleDeg` (number, default `45`, range -180 to 180); `m` (integer, default `2`, range 1 to 12); `n` (integer, default `3`, range 1 to 12).

Source: manifest `type-10f0ea8edfaf.js`; view `visualization-d7399f48c4f9.js` → `SegmentRatioVisualization`.

#### Selection patterns

{pattern} selection panel at {stage}.

Type `SELECTION_PATTERNS` · manifest v3.

Parameters: `initial_selection_pattern` (enum, default `stabilizing`, one of `stabilizing`, `directional`, `disruptive`).

Source: manifest `type-111ad055626d.js`; view `visualization-6fee9c8088f1.js` → `SelectionPatternsVisualization`.

#### Selection sort

Type `SELECTION_SORT` · manifest v2.

Parameters: `order` (enum, default `6,3,8,2,7,1,5,4`, one of `6,3,8,2,7,1,5,4`, `8,7,6,5,4,3,2,1`, `1,2,3,4,5,6,7,8`, `4,1,7,3,8,5,2,6`).

Source: manifest `type-979c1644f178.js`; view `visualization-afe5fc221ab8.js` → `SelectionSortVisualization`.

#### Set operations venn regions

Type `SET_OPERATIONS_VENN_REGIONS` · manifest v2.

Parameters: `operation` (enum, default `union`, one of `union`, `intersection`, `a_minus_b`, `b_minus_a`, `a_complement`, `b_complement`).

Source: manifest `model-ec0b6a77f077.js`; view `visualization-78116a5cdaae.js` → `SetOperationsVennRegionsVisualization`.

#### Shadow price: `P = 3x + 4y`

Resource limit {variable}

Type `SHADOW_PRICE` · manifest v1 · formula `P = 3x + 4y`.

Parameters: `resourceLimit` (number, default `12`, range 8 to 18).

Source: manifest `model-f675b47b1a69.js`; view `visualization-cab03dd1ef12.js` → `ShadowPriceVisualization`.

#### Shutdown decision

Type `SHUTDOWN_DECISION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a81f0793d99c.js` → `ShutdownDecisionVisualization`.

#### Side by side box plots

Comparison-group median

Type `SIDE_BY_SIDE_BOX_PLOTS` · manifest v2.

Parameters: `initial_comparison` (enum, default `same-median-different-iqr`, one of `same-median-different-iqr`, `different-median-same-iqr`, `different-median-different-iqr`).

Source: manifest `model-7b21f981f07c.js`; view `visualization-44327f57a1fb.js` → `SideBySideBoxPlotsVisualization`.

#### Similar triangles

Type `SIMILAR_TRIANGLES` · manifest v3.

Parameters: `scale` (number, default `1.4`, range 0.5 to 2).

Source: manifest `type-57ca60bb3e4c.js`; view `visualization-290afaca4cd7.js` → `SimilarTrianglesVisualization`.

#### Simple division

Type `SIMPLE_DIVISION` · manifest v2.

Parameters: `dividend` (integer, default `14`, range 1 to 30); `divisor` (integer, default `4`, range 1 to 10).

Source: manifest `model-1b1a0d17905e.js`; view `visualization-8420e53d9d97.js` → `SimpleDivisionVisualization`.

#### Simple pendulum: `T \approx 2\pi\sqrt{\frac{L}{g}}`

Type `SIMPLE_PENDULUM` · manifest v1 · formula `T \approx 2\pi\sqrt{\frac{L}{g}}`.

Parameters: `lengthMeters` (number, default `1.2`, range 0.5 to 2); `startingAngleDegrees` (number, default `35`, range 5 to 60).

Source: manifest `type-fff8bf6df8e9.js`; view `visualization-e60aed5b2cdd.js` → `SimplePendulumVisualization`.

#### Simplified fraction

Type `SIMPLIFIED_FRACTION` · manifest v2.

Parameters: `numerator` (integer, default `6`, range 1 to 12); `denominator` (integer, default `8`, range 4 to 24).

Source: manifest `type-b2d049022561.js`; view `visualization-c15db09d93cc.js` → `SimplifiedFractionVisualization`.

#### Simpson rule

Type `SIMPSON_RULE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-8927dca5eddf.js` → `SimpsonRuleVisualization`.

#### Singly linked list pointers

Type `SINGLY_LINKED_LIST_POINTERS` · manifest v2.

Parameters: `operation` (enum, default `insert`, one of `insert`, `delete`).

Source: manifest `type-bc36333e58e1.js`; view `visualization-be90ab2044b9.js` → `SinglyLinkedListPointersVisualization`.

#### Singular value decomposition: `A=U\Sigma V^{\mathsf T}`

Type `SINGULAR_VALUE_DECOMPOSITION` · manifest v1 · formula `A=U\Sigma V^{\mathsf T}`.

Parameters: `rank` (integer, default `2`, range 1 to 4).

Source: manifest `type-3a822ada5784.js`; view `visualization-fc8a83d1f057.js` → `SingularValueDecompositionVisualization`.

#### Skeleton and muscle movement

Type `SKELETON_AND_MUSCLE_MOVEMENT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-58db30e1fda0.js` → `SkeletonAndMuscleMovementVisualization`.

#### Skewness direction

Type `SKEWNESS_DIRECTION` · manifest v2.

Parameters: `direction` (enum, default `right`, one of `left`, `right`); `skewStrength` (number, default `0.6`, range 0 to 1).

Source: manifest `model-f7b391d4c9ce.js`; view `visualization-f899e108a585.js` → `SkewnessDirectionVisualization`.

#### Sleep cycle hypnogram

Type `SLEEP_CYCLE_HYPNOGRAM` · manifest v4.

Parameters: `sleep_duration_hours` (number, default `8`, range 5 to 10).

Source: manifest `model-af359ee5ae9b.js`; view `visualization-cb3d9482179d.js` → `Visualization`.

#### Sliding filament muscle contraction

Calcium absent

Type `SLIDING_FILAMENT_MUSCLE_CONTRACTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-37a0afeb1ea8.js` → `SlidingFilamentVisualization`.

#### Slope equation

Type `SLOPE_EQUATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-49532fc45da8.js` → `SlopeEquationVisualization`.

#### Slope intercept: `y = mx + b`

Type `SLOPE_INTERCEPT` · manifest v2 · formula `y = mx + b`, also `f(x)=mx+b`, `y = mx + c`.

Parameters: `slope` (number, default `1`, range -10000 to 10000); `intercept` (number, default `5`, range -10000 to 10000).

Source: manifest `type-110ca488953a.js`; view `visualization-a1e384b72497.js` → `SlopeInterceptVisualization`.

#### Sn1 vs sn2 substitution

Substitution mechanism

Type `SN1_VS_SN2_SUBSTITUTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-95391c407449.js` → `Visualization`.

#### Soil field capacity and wilting point

Soil-water state

Type `SOIL_FIELD_CAPACITY_AND_WILTING_POINT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-198c92475803.js` → `SoilWaterVisualization`.

#### Soil texture and water retention

Emphasized soil texture

Type `SOIL_TEXTURE_AND_WATER_RETENTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-47e39cb3668f.js` → `SoilTextureAndWaterRetentionVisualization`.

#### Soil texture triangle

Sand percentage

Type `SOIL_TEXTURE_TRIANGLE` · manifest v1.

Parameters: `sand_percent` (number, default `40`, range 0 to 100); `clay_percent` (number, default `20`, range 0 to 100).

Source: manifest `type-4ea25b9db993.js`; view `visualization-bd22c317154b.js` → `Visualization`.

#### Solar photovoltaic system

Available sunlight

Type `SOLAR_PHOTOVOLTAIC_SYSTEM` · manifest v2.

Parameters: `array_capacity_kw` (number, default `6`, range 1 to 20).

Source: manifest `type-f31fc951c570.js`; view `visualization-ce20c0307875.js` → `SolarPhotovoltaicSystemVisualization`.

#### Solenoid internal field: `B = \mu_0 n I`

Clockwise, viewed from the left end

Type `SOLENOID_INTERNAL_FIELD` · manifest v1 · formula `B = \mu_0 n I`.

Parameters: `currentAmperes` (number, default `2`, range 0.5 to 5); `turnsPerMeter` (number, default `500`, range 100 to 1000); `direction` (enum, default `counterclockwise`, one of `clockwise`, `counterclockwise`).

Source: manifest `type-17796e12b6d2.js`; view `visualization-11097d64a5d8.js` → `SolenoidInternalFieldVisualization`.

#### Solow steady state: `s f(k^*) = (\delta + n + g)k^*`

Type `SOLOW_STEADY_STATE` · manifest v4 · formula `s f(k^*) = (\delta + n + g)k^*`.

Parameters: `savingRatePercent` (number, default `40`, range 20 to 50); `depreciationRatePercent` (number, default `5`, range 4.5 to 10); `populationGrowthRatePercent` (number, default `1.5`, range 1 to 4); `technologyGrowthRatePercent` (number, default `2`, range 1.5 to 4).

Source: manifest `type-3ecced4722ba.js`; view `visualization-958f730a4835.js` → `SolowSteadyStateVisualization`.

#### Solubility curve

Potassium nitrate

Type `SOLUBILITY_CURVE` · manifest v2.

Parameters: `solute` (enum, default `potassium nitrate`, one of `potassium nitrate`, `sodium chloride`, `cerium(III) sulfate`).

Source: manifest `model-17f916a4e975.js`; view `visualization-84d1e9441980.js` → `SolubilityCurveVisualization`.

#### Solubility equilibrium

Initial ion product relative to Ksp

Type `SOLUBILITY_EQUILIBRIUM` · manifest v4.

Parameters: `dissolution_stoichiometry` (enum, default `MX`, one of `MX`, `MX2`, `M2X3`); `ksp` (number, default `8.5e-17`, range 1e-18 to 1e-16).

Source: manifest `model-57d17e7a5c30.js`; view `visualization-420d67e21af0.js` → `SolubilityEquilibriumVisualization`.

#### Solution dilution: `M_1V_1=M_2V_2`

Type `SOLUTION_DILUTION` · manifest v1 · formula `M_1V_1=M_2V_2`.

Parameters: `initialConcentrationMolesPerLiter` (number, default `1.5`, range 0.1 to 3); `initialVolumeLiters` (number, default `2`, range 0.5 to 5); `waterAddedLiters` (number, default `3`, range 0 to 5).

Source: manifest `type-b20da9986277.js`; view `visualization-9aa98497644c.js` → `SolutionDilutionVisualization`.

#### Speciation

Speciation stage

Type `SPECIATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-d8d567487502.js` → `SpeciationVisualization`.

#### Specific heat: `\Delta T = \frac{q}{mc}`

{material} sample

Type `SPECIFIC_HEAT` · manifest v1 · formula `\Delta T = \frac{q}{mc}`.

Parameters: `material` (enum, default `water`, one of `copper`, `sand`, `water`); `heatKj` (number, default `40`, range 0 to 60).

Source: manifest `type-34ba530d4dd9.js`; view `visualization-6a4e372e92ad.js` → `SpecificHeatVisualization`.

#### Sphere volume: `V = \frac{4}{3}\pi r^3`

Type `SPHERE_VOLUME` · manifest v4 · formula `V = \frac{4}{3}\pi r^3`, also `4/3pir^3=v`, `4/3pir^3`.

Parameters: `radius` (number, default `3`, range 0.01 to 10000).

Source: manifest `type-6b1390f6b07f.js`; view `visualization-961bfffbf6fc.js` → `SphereVolumeVisualization`.

#### Spreadsheet if function

Type `SPREADSHEET_IF_FUNCTION` · manifest v2.

Parameters: `comparison_operator` (enum, default `>=`, one of `>`, `>=`, `<`, `<=`); `initial_input_value` (number, default `8`, range 0 to 20); `initial_comparison_value` (number, default `10`, range 0 to 20).

Source: manifest `model-379965cd8d4f.js`; view `visualization-9d6eab3c43d3.js` → `SpreadsheetIfVisualization`.

#### Spreadsheet text extraction

Choose LEFT, RIGHT, or MID

Type `SPREADSHEET_TEXT_EXTRACTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-95717fde7295.js` → `Visualization`.

#### Sql ddl vs dml

Type `SQL_DDL_VS_DML`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-bacf64045a16.js` → `Visualization`.

#### Sql group by

Type `SQL_GROUP_BY` · manifest v3.

Parameters: `groupBy` (enum, default `country`, one of `country`, `age`).

Source: manifest `model-a061927447b9.js`; view `visualization-ad789aaeaeeb.js` → `SqlGroupByVisualization`.

#### Sql join

Type `SQL_JOIN` · manifest v2.

Parameters: `joinType` (enum, default `inner`, one of `inner`, `left`, `right`, `full`).

Source: manifest `model-f4de27b0379a.js`; view `visualization-49f795bbc4ba.js` → `SqlJoinVisualization`.

#### Sql primary foreign key constraints

Insert a child with an existing parent

Type `SQL_PRIMARY_FOREIGN_KEY_CONSTRAINTS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-cbfc2c7ed6c8.js` → `Visualization`.

#### Sql transaction commit rollback

Type `SQL_TRANSACTION_COMMIT_ROLLBACK` · manifest v2.

Parameters: `transfer_amount` (number, default `150`, range 25 to 500).

Source: manifest `model-b26f29efe99c.js`; view `visualization-2cc33a918cff.js` → `SqlTransactionVisualization`.

#### Square area

Type `SQUARE_AREA`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-cfbf243ac2ef.js` → `SquareAreaVisualization`.

#### Sras

Signed short-run aggregate supply shift

Type `SRAS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-60704f5b1c51.js` → `SrasVisualization`.

#### Standard deviation: `\sigma = \sqrt{\frac{1}{N}\sum_{i=1}^{N}(x_i-\mu)^2}`

Population standard deviation

Type `STANDARD_DEVIATION` · manifest v1 · formula `\sigma = \sqrt{\frac{1}{N}\sum_{i=1}^{N}(x_i-\mu)^2}`, also `\sigma=\sqrt{\frac{\sum(x_i-\mu)^2}{N}}`, `\sigma = \sqrt{E[(X-\mu)^2]}`.

Parameters: `sigma` (number, default `1.5`, range 0 to 3).

Source: manifest `model-a45393aa052e.js`; view `visualization-cdffe5686823.js` → `StandardDeviationVisualization`.

#### Standard score z: `z = \frac{x - \mu}{\sigma}`

Type `STANDARD_SCORE_Z` · manifest v6 · formula `z = \frac{x - \mu}{\sigma}`, also `z = \frac{x - \bar{x}}{s}`, `z = \frac{\bar{x} - \mu_0}{\sigma / \sqrt{n}}`, `z = \frac{\bar{x} - \mu0}{\sigma / \sqrt{n}}`.

Parameters: `x` (number, default `1.2`, range -4 to 4); `mu` (number, default `0`, range -1.5 to 1.5); `sigma` (number, default `1`, range 0.4 to 1.8).

Source: manifest `type-3941c7525dca.js`; view `visualization-fbc71dd6928e.js` → `StandardScoreZVisualization`.

#### States of matter particle model

State of matter

Type `STATES_OF_MATTER_PARTICLE_MODEL`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-b9d1f3ad7b5a.js` → `Visualization`.

#### Stereo field

Adjust stereo pan

Type `STEREO_FIELD`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-789da70a78a5.js` → `StereoFieldVisualization`.

#### Stoichiometric mole ratios: `2\mathrm{H_2} + \mathrm{O_2} \rightarrow 2\mathrm{H_2O}`

Amount of {name} in moles

Type `STOICHIOMETRIC_MOLE_RATIOS` · manifest v3 · formula `2\mathrm{H_2} + \mathrm{O_2} \rightarrow 2\mathrm{H_2O}`.

Parameters: `reactionExtentMoles` (number, default `1`, range 0.5 to 5).

Source: manifest `model-4a23866f1ccf.js`; view `visualization-6ff8fa763b66.js` → `StoichiometricMoleRatiosVisualization`.

#### Stopping distance safe following: `d_{\mathrm{stop}}=d_{\mathrm{reaction}}+d_{\mathrm{braking}}`

Initial speed

Type `STOPPING_DISTANCE_SAFE_FOLLOWING` · manifest v5 · formula `d_{\mathrm{stop}}=d_{\mathrm{reaction}}+d_{\mathrm{braking}}`.

Parameters: `speedKmh` (number, default `60`, range 30 to 100); `reactionTimeSeconds` (number, default `1`, range 0.5 to 2); `roadCondition` (enum, default `dry`, one of `dry`, `wet`, `snow_ice`).

Source: manifest `type-23e40668163a.js`; view `visualization-43444425cf46.js` → `StoppingDistanceVisualization`.

#### Storm hydrograph

Rainfall-intensity plot. Peak rainfall occurs at {hour, plural, one {# hour} other {# hours}}; the rainfall event is separate from river discharge and bankfull capacity.

Type `STORM_HYDROGRAPH`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-361d1806cb8f.js` → `Visualization`.

#### Straight line depreciation: `D = \frac{C-S}{L}`

Type `STRAIGHT_LINE_DEPRECIATION` · manifest v3 · formula `D = \frac{C-S}{L}`.

Parameters: `costUsd` (number, default `60000`, range 20000 to 100000); `salvageFraction` (number, default `0.1`, range 0 to 0.5); `usefulLifeYears` (integer, default `5`, range 3 to 10); `ageFraction` (number, default `0.4`, range 0 to 1).

Source: manifest `model-586cf7d3fcc3.js`; view `visualization-be4e2b162390.js` → `StraightLineDepreciationVisualization`.

#### Stratospheric ozone depletion

Typical stratosphere

Type `STRATOSPHERIC_OZONE_DEPLETION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a0157992a82b.js` → `Visualization`.

#### Stress strain material limits

Type `STRESS_STRAIN_MATERIAL_LIMITS` · manifest v1.

Parameters: `material` (enum, default `steel`, one of `steel`, `aluminum`, `copper`).

Source: manifest `model-dc171645f526.js`; view `visualization-e5e9cf88d802.js` → `StressStrainVisualization`.

#### Strong vs weak acid

Shared acid concentration

Type `STRONG_VS_WEAK_ACID` · manifest v2.

Parameters: `initial_concentration_molar` (number, default `0.15`, range 0.1 to 0.25).

Source: manifest `type-e8c4aa2e5b51.js`; view `visualization-1b1589d54911.js` → `Visualization`.

#### Structural isomers

Example family

Type `STRUCTURAL_ISOMERS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-6f8389c0db30.js` → `Visualization`.

#### Subtracting integers

Type `SUBTRACTING_INTEGERS` · manifest v1.

Parameters: `minuend` (integer, default `7`, range 1 to 12); `subtrahend` (integer, default `4`, range 1 to 12).

Source: manifest `model-daf7badaab95.js`; view `visualization-c7286f295924.js` → `SubtractingIntegersVisualization`.

#### Subtracting negative integers: `a - n = a + |n|, \quad n < 0`

Type `SUBTRACTING_NEGATIVE_INTEGERS` · manifest v1 · formula `a - n = a + |n|, \quad n < 0`.

Parameters: `positiveInteger` (integer, default `7`, range 1 to 12); `negativeInteger` (integer, default `-4`, range -12 to -1).

Source: manifest `model-fd2977478028.js`; view `visualization-c41ec5c14ba9.js` → `SubtractingNegativeIntegersVisualization`.

#### Successive percent change: `100\left(1+\frac{p_1}{100}\right)\left(1+\frac{p_2}{100}\right)`

First percent change

Type `SUCCESSIVE_PERCENT_CHANGE` · manifest v3 · formula `100\left(1+\frac{p_1}{100}\right)\left(1+\frac{p_2}{100}\right)`.

Parameters: `firstChangePercent` (number, default `50`, range -95 to 100); `secondChangePercent` (number, default `-50`, range -100 to 100).

Source: manifest `type-d21946d43d46.js`; view `visualization-269bf2659ccf.js` → `SuccessivePercentChangeVisualization`.

#### Supply and demand

Type `SUPPLY_AND_DEMAND` · manifest v4.

Parameters: `demand_shift` (number, default `10`, range -20 to 20); `supply_shift` (number, default `0`, range -20 to 20).

Source: manifest `model-4017459b0c00.js`; view `visualization-e3688210e54b.js` → `MarketEquilibriumShiftsVisualization`.

#### Supply curve

Type `SUPPLY_CURVE` · manifest v1.

Parameters: `price` (number, default `5`, range 2 to 8); `supplyShift` (number, default `0`, range -1 to 1).

Source: manifest `type-592d41260a2e.js`; view `visualization-753a5dd4a510.js` → `SupplyCurveVisualization`.

#### Supply shock

Signed supply shock

Type `SUPPLY_SHOCK`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2db32ac3ed36.js` → `SupplyShockVisualization`.

#### Surface area cube

Type `SURFACE_AREA_CUBE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-2250302f4ab7.js` → `SurfaceAreaCubeVisualization`.

#### Surface area sphere: `S = 4\pi r^2`

Type `SURFACE_AREA_SPHERE` · manifest v3 · formula `S = 4\pi r^2`, also `S = 4\pi r^2;`, `a=4pir^2`, `4pir^2=a`, `4pir^2=s`, `4pir^2`.

Parameters: `radius` (number, default `3`, range 0.01 to 10000).

Source: manifest `template-c6ddf2ee2bfb.js`; view `visualization-41c908f109cf.js` → `SurfaceAreaSphereVisualization`.

#### Surface area to volume ratio

Type `SURFACE_AREA_TO_VOLUME_RATIO` · manifest v1.

Parameters: `side_length` (integer, default `3`, range 1 to 6).

Source: manifest `type-96f57cd357c8.js`; view `visualization-4bf2630deed3.js` → `SurfaceAreaToVolumeRatioVisualization`.

#### Survivorship curves

Relative age as a percentage of maximum lifespan

Type `SURVIVORSHIP_CURVES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-c28962e80ffe.js` → `Visualization`.

#### Synaptic transmission

Type `SYNAPTIC_TRANSMISSION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ccd3ecf1f69e.js` → `SynapticTransmissionVisualization`.

#### Synth signal flow

LFO destination

Type `SYNTH_SIGNAL_FLOW`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e784a3d093b0.js` → `Visualization`.

#### Synthetic division

Type `SYNTHETIC_DIVISION` · manifest v1.

Parameters: `dividendCoefficient3` (integer, default `4`, range -20 to 20); `dividendCoefficient2` (integer, default `7`, range -20 to 20); `dividendCoefficient1` (integer, default `-13`, range -20 to 20); `dividendCoefficient0` (integer, default `6`, range -20 to 20); `divisorConstant` (integer, default `3`, range -5 to 5).

Source: manifest `model-dabd83a67c23.js`; view `visualization-dbaf10d5e784.js` → `SyntheticDivisionVisualization`.

#### System of equations

Type `SYSTEM_OF_EQUATIONS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a4bad3fd7b09.js` → `SystemOfEquationsVisualization`.

#### T distribution: `T=\frac{\bar{x}-\mu}{s/\sqrt{n}}`

Degrees of freedom

Type `T_DISTRIBUTION` · manifest v2 · formula `T=\frac{\bar{x}-\mu}{s/\sqrt{n}}`.

Parameters: `degrees_of_freedom` (integer, default `5`, range 3 to 60); `central_probability` (number, default `0.95`, range 0.9 to 0.99).

Source: manifest `model-23ef77a43b60.js`; view `visualization-3fc939dedab4.js` → `Visualization`.

#### T stat p score

Observed t-statistic

Type `T_STAT_P_SCORE` · manifest v1.

Parameters: `tStatistic` (number, default `2`, range -5 to 5); `degreesOfFreedom` (integer, default `10`, range 1 to 50); `testType` (enum, default `two_sided`, one of `one_sided`, `two_sided`).

Source: manifest `model-2519c21474d3.js`; view `visualization-fc94395e3620.js` → `TStatPScoreVisualization`.

#### Tangent segments common point: `PA = PB`

Type `TANGENT_SEGMENTS_COMMON_POINT` · manifest v1 · formula `PA = PB`.

Parameters: `radius` (number, default `3.5`, range 2.5 to 4.5); `pointDistance` (number, default `7.2`, range 5.8 to 7.2); `pointAngleDeg` (number, default `180`, range 145 to 215).

Source: manifest `type-32562c107c2d.js`; view `visualization-d7a70730f54f.js` → `TangentSegmentsCommonPointVisualization`.

#### Tariff

Type `TARIFF`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-398053d21b64.js` → `Visualization`.

#### Tax incidence and elasticity

Type `TAX_INCIDENCE_AND_ELASTICITY` · manifest v5.

Parameters: `taxPerUnit` (number, default `10`, range 5 to 35); `relativeElasticity` (enum, default `balanced`, one of `balanced`, `demand_more_inelastic`, `supply_more_inelastic`).

Source: manifest `model-49a33d251c4c.js`; view `visualization-c195f90b2f9d.js` → `ExciseTaxVisualization`.

#### Taxes and subsidies

Subsidy per unit

Type `TAXES_AND_SUBSIDIES` · manifest v5.

Parameters: `subsidy_per_unit` (number, default `1.2`, range 0 to 4.2).

Source: manifest `model-cc02c8adab2a.js`; view `visualization-da5f52437ac7.js` → `Visualization`.

#### Taylor series expansion

Type `TAYLOR_SERIES_EXPANSION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-8d0458a13bf6.js` → `TaylorSeriesExpansionVisualization`.

#### Tcp three way handshake

TCP handshake stage

Type `TCP_THREE_WAY_HANDSHAKE` · manifest v3.

Parameters: `client_initial_sequence` (integer, default `100`, range 0 to 9998); `server_initial_sequence` (integer, default `400`, range 0 to 9998).

Source: manifest `model-11da4540b9d5.js`; view `visualization-1904c8dba87b.js` → `TcpThreeWayHandshakeVisualization`.

#### Tcp vs udp

Type `TCP_VS_UDP` · manifest v2.

Parameters: `protocol` (enum, default `tcp`, one of `tcp`, `udp`); `lossMode` (enum, default `drop_packet_3`, one of `none`, `drop_packet_3`).

Source: manifest `model-a7c5b23f898c.js`; view `visualization-5f7aa0b7d680.js` → `TcpVsUdpVisualization`.

#### Tempo marking chart

Select a tempo marking

Type `TEMPO_MARKING_CHART`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-55faa9db8360.js` → `Visualization`.

#### Tendon reflex

Type `TENDON_REFLEX`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-4486ce42cd7f.js` → `TendonReflexVisualization`.

#### Test cross

AA, homozygous dominant

Type `TEST_CROSS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-dda36f4b811c.js` → `Visualization`.

#### Thermohaline circulation

Type `THERMOHALINE_CIRCULATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-326f3557d49c.js` → `Visualization`.

#### Three set inclusion exclusion: `|A \cup B \cup C| = |A| + |B| + |C| - |A \cap B| - |A \cap C| - |B \cap C| + |A \cap B \cap C|`

Inclusion-exclusion step

Type `THREE_SET_INCLUSION_EXCLUSION` · manifest v1 · formula `|A \cup B \cup C| = |A| + |B| + |C| - |A \cap B| - |A \cap C| - |B \cap C| + |A \cap B \cap C|`.

Parameters: `setACount` (integer, default `21`, range 12 to 30); `setBCount` (integer, default `21`, range 12 to 30); `setCCount` (integer, default `18`, range 12 to 30).

Source: manifest `model-92f4db76ba27.js`; view `visualization-2d972856d54e.js` → `ThreeSetInclusionExclusionVisualization`.

#### Thyroid regulation

Type `THYROID_REGULATION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-5c7e5cc221a3.js` → `ThyroidRegulationVisualization`.

#### Torque

Type `TORQUE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-6245129fdab7.js` → `TorqueVisualization`.

#### Transversal angle relationships

Type `TRANSVERSAL_ANGLE_RELATIONSHIPS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-7f3e6108bcad.js` → `TransversalAngleRelationshipsVisualization`.

#### Trapezoid area

Type `TRAPEZOID_AREA`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e0cb3ccfaa74.js` → `TrapezoidAreaVisualization`.

#### Trapezoidal rule

Type `TRAPEZOIDAL_RULE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-bab55a37c3be.js` → `IntegrationEstimationVisualization`.

#### Triangle angle sum

Type `TRIANGLE_ANGLE_SUM`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a31a69800f71.js` → `TriangleAngleSumVisualization`.

#### Triangle angle sum proof

Type `TRIANGLE_ANGLE_SUM_PROOF`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-60d9c200bb97.js` → `TriangleAngleSumProofVisualization`.

#### Triangle area: `A = \frac{1}{2}bh`

Type `TRIANGLE_AREA` · manifest v3 · formula `A = \frac{1}{2}bh`, also `A = \frac{1}{2} b h`, `a=bh/2`, `1/2bh=a`, `bh/2=a`, `1/2bh`, `b = \frac{2A}{h}`, `h = \frac{2A}{b}`.

Parameters: `base` (number, default `8`, range 0.01 to 10000); `height` (number, default `6`, range 0.01 to 10000).

Source: manifest `type-cb23494cad1e.js`; view `visualization-1d8a77daac0f.js` → `TriangleAreaVisualization`.

#### Trig angle sum identity

Type `TRIG_ANGLE_SUM_IDENTITY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f6cd9e19eb76.js` → `TrigAngleSumIdentityVisualization`.

#### Trig identity pythagorean

Type `TRIG_IDENTITY_PYTHAGOREAN`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-abf9e9d675e7.js` → `TrigIdentityVisualization`.

#### Trig inverse

Graph of the inverse trigonometric function. The highlighted point has input {inputValue} and theta {angleRadiansCount, plural, one {{angleRadians} radian} other {{angleRadians} radians}}, about {angleDegreesCount, plural, one {{angleDegrees} degree} other {{angleDegrees} degrees}}.

Type `TRIG_INVERSE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-ffa80ec6277b.js` → `TrigInverseVisualization`.

#### Trig ratio tangent: `\tan(\theta) = \frac{\sin(\theta)}{\cos(\theta)}`

Type `TRIG_RATIO_TANGENT` · manifest v4 · formula `\tan(\theta) = \frac{\sin(\theta)}{\cos(\theta)}`, also `\tan x = \frac{\sin x}{\cos x}`, `\tan(\theta)=\frac{opposite}{adjacent}`.

Parameters: `angleDeg` (number, default `35`, range 0.01 to 89.99); `angleLabel` (enum, default `θ`, one of `θ`, `α`, `β`, `φ`, `γ`).

Source: manifest `type-ffe33386dff8.js`; view `visualization-397c413e821f.js` → `TrigRatioTangentVisualization`.

#### Two cable static equilibrium

Type `TWO_CABLE_STATIC_EQUILIBRIUM` · manifest v2.

Parameters: `leftAngleDegrees` (number, default `45`, range 10 to 80); `rightAngleDegrees` (number, default `45`, range 10 to 80); `weightNewtons` (number, default `200`, range 50 to 500).

Source: manifest `type-3854ea3b6661.js`; view `visualization-474305e4eeee.js` → `TwoCableEquilibriumVisualization`.

#### Two digit multiply

First two-digit factor

Type `TWO_DIGIT_MULTIPLY` · manifest v1.

Parameters: `factor1` (integer, default `24`, range 10 to 99); `factor2` (integer, default `87`, range 10 to 99).

Source: manifest `model-848a1637af6a.js`; view `visualization-2dc18c57dbbd.js` → `TwoDigitMultiplyVisualization`.

#### Two dimensional array indexing

Row index

Type `TWO_DIMENSIONAL_ARRAY_INDEXING` · manifest v2.

Parameters: `rows` (integer, default `3`, range 2 to 5); `columns` (integer, default `5`, range 2 to 6).

Source: manifest `model-6157f9be0476.js`; view `visualization-60e15b553536.js` → `Visualization`.

#### Two sample t test

Observed difference between group means

Type `TWO_SAMPLE_T_TEST` · manifest v2.

Parameters: `meanDifference` (number, default `1.5`, range -3 to 3); `standardError` (number, default `0.75`, range 0.75 to 3); `degreesOfFreedom` (number, default `20`, range 2 to 200).

Source: manifest `model-2470e84b6d61.js`; view `visualization-765fe6226c37.js` → `TwoSampleTTestVisualization`.

#### Twos complement

Type `TWOS_COMPLEMENT` · manifest v3.

Parameters: `bit_width` (enum, default `8`, one of `4`, `8`, `16`); `initial_value` (integer, default `-4`, range -32768 to 32767).

Source: manifest `model-467b7dfbb450.js`; view `visualization-1ba2371b3add.js` → `TwosComplementVisualization`.

#### Type i type ii power

Significance level

Type `TYPE_I_TYPE_II_POWER`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-880a45e7e46c.js` → `TypeITypeIIPowerVisualization`.

#### Union probability inclusion exclusion

Type `UNION_PROBABILITY_INCLUSION_EXCLUSION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-91d0e9835b2f.js` → `UnionProbabilityInclusionExclusionVisualization`.

#### Unit circle: `x^2 + y^2 = 1`

Type `UNIT_CIRCLE` · manifest v3 · formula `x^2 + y^2 = 1`, also `1 = x^2 + y^2`, `x^2 + y^2 = 1^2`, `(x-0)^2 + (y+0)^2 = 1`, `(\cos\theta, \sin\theta)`.

Parameters: `angleDeg` (number, default `45`, range -36000 to 36000).

Source: manifest `type-4677b661e846.js`; view `visualization-55ca484d7edf.js` → `UnitCircleVisualization`.

#### Urbanization and impervious surfaces

Land cover

Type `URBANIZATION_AND_IMPERVIOUS_SURFACES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-5ec4331c6707.js` → `UrbanizationVisualization`.

#### Vapor pressure

Type `VAPOR_PRESSURE` · manifest v5.

Parameters: `initial_temperature_c` (number, default `25`, range 0 to 60); `surrounding_pressure_kpa` (number, default `101.325`, range 40 to 160).

Source: manifest `type-15f2f7d7853c.js`; view `visualization-d6369f624c33.js` → `VaporPressureVisualization`.

#### Vapor pressure lowering: `P_{\mathrm{solution}}=X_{\mathrm{solvent}}P^\circ_{\mathrm{solvent}}`

Nonvolatile-solute mole fraction

Type `VAPOR_PRESSURE_LOWERING` · manifest v3 · formula `P_{\mathrm{solution}}=X_{\mathrm{solvent}}P^\circ_{\mathrm{solvent}}`.

Parameters: `pure_solvent_vapor_pressure_kpa` (number, default `100`, range 10 to 200).

Source: manifest `model-715993df7e45.js`; view `visualization-b128fecccca5.js` → `VaporPressureLoweringVisualization`.

#### Variance

Type `VARIANCE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-cf32904930e9.js` → `VarianceVisualization`.

#### Vector components: `x=r\cos\theta,\qquad y=r\sin\theta`

Type `VECTOR_COMPONENTS` · manifest v2 · formula `x=r\cos\theta,\qquad y=r\sin\theta`, also `\vec v=\langle r\cos\theta,\ r\sin\theta\rangle`, `(x,y)=(r\cos\theta,r\sin\theta)`.

Parameters: `magnitude` (number, default `6`, range 0.1 to 100); `angleDeg` (number, default `35`, range -180 to 180).

Source: manifest `type-f1e9ea4637a1.js`; view `visualization-50f2d98e7835.js` → `VectorComponentsVisualization`.

#### Vector dot product

Vector {vector}, {component} component

Type `VECTOR_DOT_PRODUCT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-3ad8ebfd9be9.js` → `VectorDotProductVisualization`.

#### Vector projection

Type `VECTOR_PROJECTION`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-189e4a4d3d10.js` → `VectorProjectionVisualization`.

#### Velocity as slope graph: `v = \frac{\Delta x}{\Delta t}`

Position point at {timeCount, plural, one {{time} second} other {{time} seconds}} and {positionCount, plural, one {{position} meter} other {{position} meters}}. Drag vertically or use the Up and Down arrow keys to change its position.

Type `VELOCITY_AS_SLOPE_GRAPH` · manifest v5 · formula `v = \frac{\Delta x}{\Delta t}`.

Parameters: `positionAt0SecondsMeters` (number, default `-3`, range -10 to 10); `positionAt2_5SecondsMeters` (number, default `4`, range -10 to 10); `positionAt5SecondsMeters` (number, default `4`, range -10 to 10); `positionAt7_5SecondsMeters` (number, default `-2`, range -10 to 10); `positionAt10SecondsMeters` (number, default `3`, range -10 to 10).

Source: manifest `model-372acd82c554.js`; view `visualization-4c8c27e4ab57.js` → `VelocityAsSlopeGraphVisualization`.

#### Venn diagram two set counting

Type `VENN_DIAGRAM_TWO_SET_COUNTING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-98d9e5e16bec.js` → `VennDiagramTwoSetCountingVisualization`.

#### Virus life cycle

Type `VIRUS_LIFE_CYCLE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-d8c2b496e466.js` → `VirusLifeCycleVisualization`.

#### Visual fields

Type `VISUAL_FIELDS`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-a79ada10d46a.js` → `VisualFieldsVisualization`.

#### Vocal ranges

Vocal classification

Type `VOCAL_RANGES`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-1f8238d5a159.js` → `Visualization`.

#### Volume cube

Type `VOLUME_CUBE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-dbceeadf2e37.js` → `VolumeCubeVisualization`.

#### Waste hierarchy

Type `WASTE_HIERARCHY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-23ed589eb85f.js` → `Visualization`.

#### Wastewater treatment

Wastewater treatment stage

Type `WASTEWATER_TREATMENT`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-e71f308ecc88.js` → `WastewaterTreatmentVisualization`.

#### Water phase diagram

Temperature in degrees Celsius

Type `WATER_PHASE_DIAGRAM` · manifest v2.

Parameters: `temperature_c` (number, default `25`, range -80 to 450); `pressure_kpa` (number, default `101.325`, range 0.001 to 50000).

Source: manifest `type-9acfe2203543.js`; view `visualization-142f29b0b5c8.js` → `WaterPhaseDiagramVisualization`.

#### Water polarity

Move neighboring water horizontally

Type `WATER_POLARITY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-43cc7290e02c.js` → `Visualization`.

#### Water potential

Magnitude of the negative solute potential on the right

Type `WATER_POTENTIAL`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-f0df496335b2.js` → `WaterPotentialVisualization`.

#### Wave speed: `v = f\lambda`

Type `WAVE_SPEED` · manifest v3 · formula `v = f\lambda`, also `\nu = \frac{c}{\lambda}`, `v = f lambda`, `v=flambda`, `v=lambdaf`, `flambda=v`, `lambdaf=v`, `f=v/lambda`, `lambda=v/f`.

Parameters: `frequency` (number, default `2`, range 0.1 to 20000); `wavelength` (number, default `3`, range 0.1 to 10000).

Source: manifest `type-ac19101079c5.js`; view `visualization-3429dfbe668f.js` → `WaveSpeedVisualization`.

#### Waveform anatomy

Choose the horizontal axis

Type `WAVEFORM_ANATOMY`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-98d5d5521bb6.js` → `WaveformAnatomyVisualization`.

#### Weight force: `F_g = mg`

Type `WEIGHT_FORCE` · manifest v3 · formula `F_g = mg`, also `F_G = m g`, `w = mg`, `F_g = m\,g`, `P = m \cdot g`, `F_g = m \cdot g`, `F_g = m \times g`, `m = \frac{F_g}{g}`, `g = \frac{F_g}{m}`.

Parameters: `mass` (number, default `8`, range 0.01 to 10000); `gravity` (number, default `9.8`, range 0 to 10000).

Source: manifest `type-722d579b6777.js`; view `visualization-af949146d52f.js` → `WeightForceVisualization`.

#### Wetland filtration and flood buffering

Wetland condition

Type `WETLAND_FILTRATION_AND_FLOOD_BUFFERING`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-441d10b08de8.js` → `Visualization`.

#### While loop boolean condition

Starting counter

Type `WHILE_LOOP_BOOLEAN_CONDITION` · manifest v2.

Parameters: `initial_counter` (integer, default `2`, range 0 to 8); `stopping_bound` (integer, default `5`, range 0 to 8).

Source: manifest `type-161aea9178de.js`; view `visualization-8735282baed7.js` → `WhileLoopVisualization`.

#### Wilcoxon rank sum

Sample pattern

Type `WILCOXON_RANK_SUM` · manifest v2.

Parameters: `initial_pattern` (enum, default `intermingled`, one of `intermingled`, `group-a-lower`, `group-a-higher`, `ties`).

Source: manifest `model-65fc78301123.js`; view `visualization-c79e18949055.js` → `WilcoxonRankSumVisualization`.

#### Wind turbine

Wind-turbine power curve. At {windSpeedCount, plural, one {{windSpeed} metre per second} other {{windSpeed} metres per second}} the turbine is in {region} and produces {power}. Cut-in is 3, rated speed is 12, and cut-out is 25 metres per second. The vertical scale is percentage of rated power.

Type `WIND_TURBINE` · manifest v3.

Parameters: `rated_power_kw` (number, default `3000`, range 100 to 20000).

Source: manifest `type-3f4953af8baf.js`; view `visualization-81fc446bf4f0.js` → `Visualization`.

#### Withdrawal reflex

Withdrawal reflex stage

Type `WITHDRAWAL_REFLEX`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-152bf315a7f7.js` → `WithdrawalReflexVisualization`.

#### Work done by force

Type `WORK_DONE_BY_FORCE`.

Source: manifest `analytics-d7f135dc6152.js (inline)`; view `visualization-12c05b44bebf.js` → `WorkDoneByForceVisualization`.

#### Z score p value

Observed z-score

Type `Z_SCORE_P_VALUE` · manifest v3.

Parameters: `zScore` (number, default `1.96`, range -3.5 to 3.5); `testType` (enum, default `two-sided`, one of `one-sided`, `two-sided`).

Source: manifest `model-a9901c18f348.js`; view `visualization-be3e85cdfd95.js` → `ZScorePValueVisualization`.

#### Zero based array indexing

Type `ZERO_BASED_ARRAY_INDEXING` · manifest v2.

Parameters: `initial_length` (integer, default `6`, range 1 to 8).

Source: manifest `model-f9237046088a.js`; view `visualization-e8fa2678d074.js` → `ZeroBasedArrayIndexingVisualization`.

### Manifest only (no renderer registered in this build) (29)

#### Animal pollination

Type `ECOSYSTEM_SERVICE_ANIMAL_POLLINATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-50b2f833c6f4.js`.

#### Animal-virus genome replication and capsid assembly

Type `ANIMAL_VIRUS_GENOME_REPLICATION_AND_CAPSID_ASSEMBLY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6780214dbd77.js`.

#### Animal-virus latency and reactivation

Type `ANIMAL_VIRUS_LATENCY_AND_REACTIVATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3eac81719681.js`.

#### Animal-virus receptor binding and host range

Type `ANIMAL_VIRUS_RECEPTOR_BINDING_AND_HOST_RANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c8bee44375f5.js`.

#### Aquatic photic and aphotic light-depth zones

Type `BIOME_AQUATIC_PHOTIC_AND_APHOTIC_ZONES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-308d0e89eeab.js`.

#### Desert plant water conservation

Type `BIOME_DESERT_PLANT_WATER_CONSERVATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-550b911e2ad9.js`.

#### Energy pyramid

Type `ENERGY_PYRAMID` · manifest v3.

Parameters: `producer_energy` (number, default `10000`, range 1000 to 100000); `transfer_efficiency_percent` (number, default `10`, range 5 to 20).

Source: manifest `type-402ae30c42ae.js`.

#### Entropy of phase changes: `\Delta S_{\mathrm{phase}}=\frac{\Delta H_{\mathrm{phase}}}{T_{\mathrm{phase}}}`

Type `ENTROPY_OF_PHASE_CHANGES` · manifest v4 · formula `\Delta S_{\mathrm{phase}}=\frac{\Delta H_{\mathrm{phase}}}{T_{\mathrm{phase}}}`.

Parameters: `melting_temperature_k` (number, default `273.15`, range 200 to 350); `boiling_temperature_k` (number, default `373.15`, range 360 to 650); `molar_enthalpy_of_fusion_kj_per_mol` (number, default `6.01`, range 2 to 20); `molar_enthalpy_of_vaporization_kj_per_mol` (number, default `40.65`, range 20 to 100).

Source: manifest `type-6211dfc72928.js`.

#### Enveloped versus non-enveloped animal viruses

Type `ENVELOPED_VERSUS_NON_ENVELOPED_ANIMAL_VIRUSES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-815448353c97.js`.

#### Enveloped-virus budding and envelope acquisition

Type `ENVELOPED_VIRUS_BUDDING_AND_ENVELOPE_ACQUISITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-811713f4a622.js`.

#### Enveloped-virus membrane fusion and uncoating

Type `ENVELOPED_VIRUS_MEMBRANE_FUSION_AND_UNCOATING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-184c3b039621.js`.

#### Eukaryotic virus host-cell infection cycle

Type `EUKARYOTIC_VIRUS_HOST_CELL_INFECTION_CYCLE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-49e316e8efab.js`.

#### Exponential population growth: `N(t)=N_0(1+r)^t`

Type `EXPONENTIAL_POPULATION_GROWTH` · manifest v3 · formula `N(t)=N_0(1+r)^t`.

Parameters: `initial_population` (integer, default `200`, range 20 to 2000); `growth_rate_percent` (number, default `10`, range 4 to 15); `elapsed_periods` (number, default `10`, range 0 to 20).

Source: manifest `type-5da229a6a104.js`.

#### Inflation cpi

Type `INFLATION_CPI` · manifest v2.

Parameters: `earlier_cpi` (number, default `120`, range 50 to 300); `later_cpi` (number, default `126`, range 50 to 300); `comparison_interval` (enum, default `twelve_months`, one of `one_month`, `twelve_months`).

Source: manifest `type-f80006839631.js`.

#### Ipv4 subnetting cidr

Type `IPV4_SUBNETTING_CIDR` · manifest v2.

Parameters: `address_octet_1` (integer, default `192`, range 128 to 223); `address_octet_2` (integer, default `168`, range 128 to 239); `address_octet_3` (integer, default `1`, range 0 to 255); `address_octet_4` (integer, default `75`, range 0 to 255); `prefix_length` (integer, default `26`, range 24 to 30).

Source: manifest `type-103197d7f37d.js`.

#### Monthly temperature and precipitation climograph

Type `BIOME_MONTHLY_TEMPERATURE_PRECIPITATION_CLIMOGRAPH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-153a2f5851e4.js`.

#### Non-enveloped-virus cell lysis and release

Type `NON_ENVELOPED_VIRUS_CELL_LYSIS_AND_RELEASE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f82f0a970c7b.js`.

#### Non-enveloped-virus endocytosis and uncoating

Type `NON_ENVELOPED_VIRUS_ENDOCYTOSIS_AND_UNCOATING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-95dd63dfb100.js`.

#### Retroviral reverse transcription and integration

Type `RETROVIRAL_REVERSE_TRANSCRIPTION_AND_INTEGRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-742314b793ee.js`.

#### Seasonal tundra active layer above permanent permafrost

Type `BIOME_TUNDRA_ACTIVE_LAYER_AND_PERMAFROST` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8924d3f45e80.js`.

#### Temperate deciduous forest seasonality

Type `BIOME_TEMPERATE_FOREST_SEASONAL_LEAF_CHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-197658cebff3.js`.

#### Temperature, precipitation, and vegetation

Type `BIOME_TEMPERATURE_PRECIPITATION_VEGETATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3c3d4ddf8eae.js`.

#### Tropical rainforest canopy layers

Type `BIOME_TROPICAL_RAINFOREST_CANOPY_LAYERS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d871c36afffe.js`.

#### Vegetation and roots reduce rainfall-driven soil erosion

Type `ECOSYSTEM_SERVICE_VEGETATION_SOIL_EROSION_PREVENTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b9a15c3acd3e.js`.

#### Viral mutation and antigenic recognition

Type `VIRAL_MUTATION_AND_ANTIGENIC_RECOGNITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9ff98c337bc8.js`.

#### Wetland flood buffering

Type `ECOSYSTEM_SERVICE_WETLAND_FLOOD_BUFFERING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d5b67a9d1e52.js`.

#### Wetland water filtration

Type `ECOSYSTEM_SERVICE_WETLAND_WATER_FILTRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1d171e6c132f.js`.

#### Whittaker annual climate and terrestrial biome diagram

Type `BIOME_WHITTAKER_CLIMATE_DIAGRAM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-36653fcd2e7f.js`.

#### Windward rainfall and a mountain rain shadow

Type `BIOME_OROGRAPHIC_RAIN_SHADOW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-79754ddd4084.js`.
