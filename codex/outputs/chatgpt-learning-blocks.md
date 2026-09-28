# ChatGPT learning blocks

Learning blocks are the interactive math, physics, chemistry, biology and data visualizations ChatGPT shows next to an answer: a graph, a 3D scene or an animation, often with sliders and switches the user can change. This build ships **1622 block types**, 1591 with a view registered: 22 three.js 3D scenes, 761 Lottie animations and 808 SVG or HTML views. 784 have an animated Lottie thumbnail, 101 stand for a named formula, and 220 take parameters the server can set.

Source: ChatGPT desktop 26.924.22138 (build 11645), `app.asar` → `webview/assets/`: the block registry `analytics-bc3295dda721.js` (1665 registered views), 1006 manifest modules (`type-*.js`) and the type enum `chatgpt_math_blocks-1c0e05f75070.js`.

## How a block reaches the conversation

- A block arrives as a **content reference** on an assistant message, category `learning_block`. Its data names the block (`matched_type`), the widget (`widget_type`), the server's block version (`server_learning_block_version`) and the starting parameter values (`encoded_initial_values`). The model's answer text is not changed; the app renders the matched block beside it, inline or as a card (`display_mode`).
- The render source the app reports for these blocks is `CHATGPT_MATH_BLOCK_RENDER_SOURCE_GENUI_LEARNING_BLOCK`: the server's generative-UI layer matched the answer to a block type. The app does not choose blocks itself.
- Formula blocks carry a `canonicalFormula` and optional `canonicalFormulaAliases` in their manifest: the equation forms a block stands for (for example `PV = nRT`).
- Feedback on a block is posted to `POST /conversation/message/learning-blocks/feedback` with the matched type, the rendered and server block versions, the initial values, whether the user edited the block, and the chosen reasons.
- A block can offer follow-up questions. Choosing one sends a new user message whose metadata marks it `followups_v2_followup_source: "learning_block_suggested_followup"`, so the next turn's context records that the question came from a block.
- Generative-UI widgets on a message that are still being completed are polled through `POST /conversation/{conversation_id}/message/{message_id}/genui/refresh_widget` (message metadata `genui_refresh`).
- Analytics actions: `CODEX_LEARNING_BLOCK_ACTION_IMPRESSION`, `_FALLBACK`, `_FOLLOW_UP_SHOWN`, `_FOLLOW_UP_SELECTED`, `_FEEDBACK_OPENED`, `_FEEDBACK_SUBMITTED` and `_FEEDBACK_FAILED`.

Counting: a block type is one manifest `type` (or, for a view whose manifest is inline in the registry, its analytics type); where a type ships more than one view or manifest version, the highest version is listed. The type enum (`CHATGPT_MATH_BLOCK_TYPE_*`) has 962 values; 125 of them have no registered view or manifest in this build (`ABSOLUTE_VALUE_DISTANCE`, `ADULT_CPR_AED_SEQUENCE`, `ALCOHOL_OXIDATION`, `APPLYING_A_SCREEN_PROTECTOR`, `APPLYING_CAULK`, `APPLYING_SUNSCREEN`, `ASTHMA_AIRWAY_FLOW`, `BACTERIAL_GROWTH_CURVE`, `BASKETBALL_LAYUP`, `BLOOD_PRESSURE_REGULATION`, `BOHR_MODEL`, `BOND_ENTHALPY`, …; all are in the JSON). Blocks registered without an analytics type (`UNSPECIFIED`) are identified by their manifest. 616 blocks keep their manifest inline in the registry chunk; their parameters are not listed here. 1 manifest modules could not be evaluated and are listed from their literals only. A title is the block's thumbnail animation name where it has one, otherwise its type name in words; the sentence under it is the view's own accessibility label.

## Blocks

### three.js 3D scenes (22)

#### Column space

Type `COLUMN_SPACE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-74d9d119e6e1.js` → `ColumnSpaceVisualization`.

#### Cylindrical coordinates

Type `CYLINDRICAL_COORDINATES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-344609314a1a.js` → `CylindricalCoordinatesVisualization`.

#### Divergence theorem flux: `\iint_{\partial V}\mathbf F\cdot\mathbf n\,dS=\iiint_V\nabla\cdot\mathbf F\,dV`

Type `DIVERGENCE_THEOREM_FLUX` · manifest v1 · formula `\iint_{\partial V}\mathbf F\cdot\mathbf n\,dS=\iiint_V\nabla\cdot\mathbf F\,dV`.

Parameters: `radius` (number, default `1.35`, range 0.8 to 1.9); `strength` (number, default `0.75`, range -1.2 to 1.2).

Source: manifest `type-a59f58f3e3e0.js`; view `visualization-6ec065ffebcf.js` → `DivergenceTheoremFluxVisualization`.

#### Double integral cartesian

Type `DOUBLE_INTEGRAL_CARTESIAN` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4bcce384ed11.js` → `CartesianDoubleIntegralVisualization`.

#### Gradient directional derivative: `D_{\mathbf u}f=\nabla f\cdot\mathbf u`

Type `GRADIENT_DIRECTIONAL_DERIVATIVE` · manifest v1 · formula `D_{\mathbf u}f=\nabla f\cdot\mathbf u`.

Parameters: `angle` (number, default `35`, range 0 to 360); `pointX` (number, default `1`, range -2.2 to 2.2); `pointY` (number, default `0.65`, range -1.6 to 1.6).

Source: manifest `type-977bdfa6cb63.js`; view `visualization-4f510da717c9.js` → `GradientDirectionalDerivativeVisualization`.

#### Jacobian grid transformation: `dA=\left|\det J\right|\,du\,dv`

Type `JACOBIAN_GRID_TRANSFORMATION` · manifest v1 · formula `dA=\left|\det J\right|\,du\,dv`.

Parameters: `scale` (number, default `1.4`, range 0.7 to 2); `shear` (number, default `0.6`, range -0.95 to 0.95).

Source: manifest `type-f72a37ec91c5.js`; view `visualization-2134a9ef1532.js` → `JacobianGridTransformationVisualization`.

#### Lagrange gradient parallelism

Type `LAGRANGE_GRADIENT_PARALLELISM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7d3d4b275750.js` → `LagrangeGradientParallelismVisualization`.

#### Line integral

Line-integral parameter {parameter}

Type `LINE_INTEGRAL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7a10a5a1d142.js` → `LineIntegralVisualization`.

#### Line integral work

Type `LINE_INTEGRAL_WORK` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-64987c5f8fcb.js` → `LineIntegralWorkVisualization`.

#### Multivariable limit paths

Type `MULTIVARIABLE_LIMIT_PATHS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b70b204af987.js` → `MultivariableLimitPathsVisualization`.

#### Null space

Type `NULL_SPACE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-70debc735c49.js` → `NullSpaceVisualization`.

#### Parametrized line 3d

Curve parameter {parameter}

Type `PARAMETRIZED_LINE_3D` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-bbf1ecff6c4b.js` → `ParametrizedLine3DVisualization`.

#### Parametrized surfaces

Type `PARAMETRIZED_SURFACES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a5b2efc9743d.js` → `ParametrizedSurfacesVisualization`.

#### Power iteration

Type `POWER_ITERATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7d370ae7166e.js` → `PowerIterationVisualization`.

#### Shifted inverse iteration

Type `SHIFTED_INVERSE_ITERATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4d697dad205e.js` → `ShiftedInverseIterationVisualization`.

#### Solar system

Type `SOLAR_SYSTEM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1525798f22d9.js` → `SolarSystemVisualization`.

#### Spherical coordinates

Type `SPHERICAL_COORDINATES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-832c0c82e5ad.js` → `SphericalCoordinatesVisualization`.

#### Surface level curves

Type `SURFACE_LEVEL_CURVES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-383479e19d16.js` → `SurfaceLevelCurvesVisualization`.

#### Tangent plane linearization: `\small f(x_0,y_0)+\nabla f(x_0,y_0)\cdot{\langle x-x_0,y-y_0\rangle}`

Type `TANGENT_PLANE_LINEARIZATION` · manifest v1 · formula `\small f(x_0,y_0)+\nabla f(x_0,y_0)\cdot{\langle x-x_0,y-y_0\rangle}`.

Parameters: `contactX` (number, default `0.65`, range -1.2 to 1.2); `contactY` (number, default `-0.45`, range -1.2 to 1.2).

Source: manifest `type-3e5d3f81a72e.js`; view `visualization-9d17d4dc40f8.js` → `TangentPlaneLinearizationVisualization`.

#### Triple integral cartesian

Type `TRIPLE_INTEGRAL_CARTESIAN` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f37c6d24e71b.js` → `CartesianTripleIntegralVisualization`.

#### Vector field curl divergence: `\begin{aligned}\operatorname{div}\mathbf F&=\nabla\cdot\mathbf F\\\operatorname{curl}\mathbf F&=\nabla\times\mathbf F\end{aligned}`

Type `VECTOR_FIELD_CURL_DIVERGENCE` · manifest v1 · formula `\begin{aligned}\operatorname{div}\mathbf F&=\nabla\cdot\mathbf F\\\operatorname{curl}\mathbf F&=\nabla\times\mathbf F\end{aligned}`.

Parameters: `field` (enum, default `rotation`, one of `source`, `sink`, `rotation`, `saddle`); `strength` (number, default `0.85`, range 0.35 to 1.45).

Source: manifest `type-2a06847ff944.js`; view `visualization-f42845076aac.js` → `VectorFieldCurlDivergenceVisualization`.

#### Vsepr geometry

Type `VSEPR_GEOMETRY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-bb05651eb1d0.js` → `VseprGeometryVisualization`.

### Lottie animations (761)

#### A and B antigen products expressed together on one AB red blood cell

Type `CODOMINANCE_ALLELE_EXPRESSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-545276c09013.js`; view `visualization-ab5a54d9cdeb.js` → `CodominanceAlleleExpressionVisualization`.

#### A basal body anchors one motile cilium across the plasma membrane

Explain how a basal body anchors a motile cilium at the plasma membrane and how its nine microtubule triplets continue into the cilium's nine outer doublets.

Type `BASAL_BODY_CILIUM_ANCHORING` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-99041db0e99c.js`; view `visualization-6a5b289f7f8e.js` → `Visualization`.

#### A biological stain reveals the same previously faint cell nucleus

Type `MICROSCOPY_STAINING_SPECIMEN_CONTRAST` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fff586ba396e.js`; view `visualization-150807aaf00a.js` → `Visualization`.

#### A competitive inhibitor occupies the substrate's own active site

Type `ENZYME_COMPETITIVE_INHIBITION_BINDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-79be525c7666.js`; view `visualization-9cde910c1740.js` → `Visualization`.

#### A complementary microRNA binds an existing mature mRNA, suppresses translation or promotes RNA degradation, and reduces protein output after transcription.

Type `MICRORNA_MRNA_TRANSLATIONAL_SILENCING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f4498f9db9f3.js`; view `visualization-ad63449bd975.js` → `Visualization`.

#### A complementary substrate fits an enzyme's specific active site

Type `ENZYME_ACTIVE_SITE_SPECIFICITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2b7c325e1fe8.js`; view `visualization-f632c06e5e9e.js` → `Visualization`.

#### A confined tumor stays above an intact boundary while invasive cells cross it

Type `BENIGN_VERSUS_INVASIVE_TUMOR_BOUNDARY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4287ce92608f.js`; view `visualization-2a6c77e1f7dd.js` → `Visualization`.

#### A fixed recessive pp tester distinguishes PP from Pp dominant-phenotype parents

Type `MENDELIAN_TEST_CROSS_GENOTYPE_INFERENCE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-1bf8bcff530f.js`; view `visualization-a5ac9de42399.js` → `Visualization`.

#### A lac-operon example aligns a CAP activator site, promoter, operator, and three structural genes that share one polycistronic mRNA.

Type `PROKARYOTIC_OPERON_ARCHITECTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8a019b8d6e07.js`; view `visualization-225306107812.js` → `Visualization`.

#### A local developmental signal induces neighboring-cell gene expression and fate

Developmental cell-fate induction: a signaling source sends a local signal to a neighboring target cell, which activates neuronal genes and becomes a neuron while preserving its original genome.

Type `DEVELOPMENTAL_CELL_FATE_INDUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7d1f02258b02.js`; view `visualization-8fd8875285ca.js` → `Visualization`.

#### A local regulator reaches a nearby receptor-bearing cell

A signaling cell secretes one local regulator that diffuses a short distance and activates the matching receptor of a nearby target cell.

Type `PARACRINE_CELL_SIGNALING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1276c3670217.js`; view `visualization-813ef4d1e711.js` → `ParacrineCellSignalingVisualization`.

#### A migratory bird follows seasonal photoperiod and resource cues

Type `SEASONAL_MIGRATION_ENVIRONMENTAL_CUES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7f09749cfe46.js`; view `visualization-765dad3e0e78.js` → `SeasonalMigrationEnvironmentalCuesVisualization`.

#### A pancreas senses high glucose and a distinct effector lowers it

High blood glucose is detected by the pancreas, insulin signals an insulin-responsive skeletal muscle target, and glucose uptake lowers the same blood-glucose deviation toward normal.

Type `FEEDBACK_SENSOR_AND_EFFECTOR_ROLES` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-fbf512d18a6c.js`; view `visualization-391daea7047b.js` → `FeedbackSensorAndEffectorRolesVisualization`.

#### A recognizable common precursor differentiates into nerve and muscle cells

Type `MULTICELLULAR_CELL_DIFFERENTIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ee3b981a0c54.js`; view `visualization-f39db07bba4c.js` → `Visualization`.

#### A rooted shoot bends toward directional light through growth

Type `PLANT_PHOTOTROPISM_DIRECTIONAL_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-eaa20eefe63b.js`; view `visualization-54c8004bbec3.js` → `PlantPhototropismDirectionalGrowthVisualization`.

#### A separate allosteric inhibitor reduces catalytic capacity without occupying the active site

Type `ENZYME_NONCOMPETITIVE_INHIBITION_ALLOSTERIC` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4a167c68f228.js`; view `visualization-b7fbfb5923d5.js` → `Visualization`.

#### A short-day plant flowers after a sufficiently long uninterrupted night

Type `PLANT_PHOTOPERIOD_SEASONAL_FLOWERING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9699a92ce5d3.js`; view `visualization-7372c33bfa80.js` → `PlantPhotoperiodSeasonalFloweringVisualization`.

#### A surface receptor responds while its water-soluble ligand stays outside

A water-soluble extracellular signal binds a cell-surface receptor without entering the cell, and the receptor-bearing target responds.

Type `CELL_SURFACE_RECEPTOR_RECOGNITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1286b1e030b2.js`; view `visualization-edf7f965dcdc.js` → `CellSurfaceReceptorRecognitionVisualization`.

#### A traveling peristaltic muscle wave propels one food bolus

Digestive peristalsis animation: one intact food bolus stays within a continuous horizontal digestive lumen while circular smooth muscle contracts behind it, the segment ahead relaxes, and the same bolus moves forward without relying on gravity.

Type `ANIMAL_DIGESTIVE_PERISTALSIS_AND_FOOD_TRANSPORT` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-7e0ee9100ae8.js`; view `visualization-d9eb44da13a3.js` → `AnimalDigestivePeristalsisAndFoodTransportVisualization`.

#### ABA versus gibberellin seed dormancy

Type `ABA_VERSUS_GIBBERELLIN_SEED_DORMANCY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-888603d16da6.js`; view `visualization-f161439a954f.js` → `Visualization`.

#### Abundant tryptophan binds an inactive trp repressor, enabling the complex to occupy the operator and stop tryptophan-biosynthesis transcription.

Type `TRP_OPERON_COREPRESSOR_SWITCH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-11defa77e1c6.js`; view `visualization-b77fef0244ed.js` → `Visualization`.

#### Acid strength versus concentration

Type `BIOLOGICAL_ACID_STRENGTH_VERSUS_CONCENTRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-414481fae786.js`; view `visualization-e7793551bda5.js` → `Visualization`.

#### Acidic lysosomal digestion remains separate from near-neutral cytosol

Type `COMPARTMENT_MICROENVIRONMENTS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-e2cd7c8e14b2.js`; view `visualization-c20fa4f6035a.js` → `Visualization`.

#### Acoelomate, pseudocoelomate, and coelomate

Type `ANIMAL_ACOELOMATE_PSEUDOCOELOMATE_COELOMATE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-94770f08d250.js`; view `visualization-38f462f2ed8b.js` → `AnimalAcoelomatePseudocoelomateCoelomateVisualization`.

#### Actin filament polymerization

Explain how actin monomers joining a filament's barbed end can advance the adjacent plasma membrane.

Type `ACTIN_FILAMENT_POLYMERIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7e1d6c4d3594.js`; view `visualization-82abb942b221.js` → `Visualization`.

#### Actin treadmilling preserves filament length during subunit turnover

Explain actin treadmilling as barbed-end addition balanced by pointed-end loss while identifiable subunits move through an approximately constant-length filament.

Type `ACTIN_FILAMENT_TREADMILLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8bf5d00b3eb9.js`; view `visualization-27df9d85a1b6.js` → `Visualization`.

#### Actin-driven cell migration

Trace how leading-edge protrusion, new adhesion, actomyosin contraction, and rear release combine to move a cell across a substrate.

Type `ACTIN_DRIVEN_CELL_MIGRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c16e7f85108b.js`; view `visualization-4c4bcc0850d1.js` → `Visualization`.

#### Action-potential depolarization and repolarization

One neuronal voltage trace reaches threshold. Sodium enters through voltage-gated channels to cause depolarization; potassium leaves to cause repolarization, a brief hyperpolarizing undershoot, and return to the resting potential.

Type `ACTION_POTENTIAL_DEPOLARIZATION_AND_REPOLARIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bd392aa3db83.js`; view `visualization-720ae1ac5384.js` → `ActionPotentialDepolarizationAndRepolarizationVisualization`.

#### Activated oncogene growth signal compared with lost tumor-suppressor brake

Type `ONCOGENE_VERSUS_TUMOR_SUPPRESSOR_LOSS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bff75777a396.js`; view `visualization-6a805114dd7b.js` → `Visualization`.

#### active-habitat-restoration-population-recovery

Type `ACTIVE_HABITAT_RESTORATION_POPULATION_RECOVERY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-97671b1f6834.js`; view `visualization-7305fed92bf9.js` → `ActiveHabitatRestorationPopulationRecoveryVisualization`.

#### Acute inflammation and neutrophil recruitment

How does acute inflammation recruit a neutrophil from blood into infected tissue? Connect local inflammatory signaling, vascular leakage, neutrophil movement out of blood vessels, and directed migration to the rapid delivery of innate defenses into infected tissue.

Type `IMMUNE_ACUTE_INFLAMMATION_NEUTROPHIL_RECRUITMENT` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-2ff2490776d8.js`; view `visualization-549b350c5864.js` → `ImmuneAcuteInflammationNeutrophilRecruitmentVisualization`.

#### Adaptation and environmental fitness

Type `ADAPTATION_ENVIRONMENTAL_FITNESS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8978b1113585.js`; view `visualization-fc73b33c567c.js` → `AdaptationEnvironmentalFitnessVisualization`.

#### Adenylyl cyclase converts ATP into intracellular cAMP that activates protein kinase A

cAMP second-messenger animation: an extracellular ligand activates a receptor and adenylyl cyclase, ATP becomes multiple intracellular cAMP molecules, and cAMP activates protein kinase A and its target.

Type `CAMP_SECOND_MESSENGER_RELAY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2595d26b3297.js`; view `visualization-24a1f623b330.js` → `Visualization`.

#### ADH osmoregulation neuroendocrine loop

Type `ADH_OSMOREGULATION_NEUROENDOCRINE_LOOP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3727660a2c24.js`; view `visualization-a5e777e2d3e2.js` → `Visualization`.

#### ADH water balance negative feedback

Type `ADH_WATER_BALANCE_NEGATIVE_FEEDBACK` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2a967b7defda.js`; view `visualization-f895e6b11fc6.js` → `AdhWaterBalanceNegativeFeedbackVisualization`.

#### Adjacent plant membranes, cellulose walls, and middle lamella

Two neighboring plant cells with plasma membranes inside separate cellulose-rich primary walls and a shared middle lamella between the walls.

Type `PLANT_CELL_WALL_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cb73f889e16d.js`; view `visualization-76fc8d220426.js` → `Visualization`.

#### Aerobic, facultative, and anaerobic bacteria share one oxygen gradient

Type `BACTERIAL_OXYGEN_REQUIREMENTS_AND_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-451f45882761.js`; view `visualization-ede053881419.js` → `BacterialOxygenRequirementsAndGrowthVisualization`.

#### agricultural-nutrient-management-runoff-tradeoffs

Type `AGRICULTURAL_NUTRIENT_MANAGEMENT_RUNOFF_TRADEOFFS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5eebf8396a1b.js`; view `visualization-e127dc1f3bf8.js` → `AgriculturalNutrientManagementRunoffTradeoffsVisualization`.

#### Aldehyde versus ketone carbonyl placement

Type `BIOLOGICAL_CARBONYL_ALDEHYDE_VERSUS_KETONE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-92b2050a1f27.js`; view `visualization-bbe2c135c997.js` → `Visualization`.

#### Algal photosynthesis and oxygen production

Type `ALGAL_PHOTOSYNTHESIS_OXYGEN_PRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a1c7352f47a1.js`; view `visualization-1d16504ec024.js` → `Visualization`.

#### All four DNA-template-to-RNA complementary transcription pairs

Type `DNA_TEMPLATE_RNA_COMPLEMENTARITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-20662f220b13.js`; view `visualization-d678c8d7d474.js` → `DnaTemplateRnaComplementarityVisualization`.

#### All-or-none action-potential threshold

A subthreshold stimulus produces no action potential; both threshold-level and stronger stimuli produce action-potential spikes of the same amplitude.

Type `ALL_OR_NONE_ACTION_POTENTIAL_THRESHOLD` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ba20d22de16e.js`; view `visualization-f14d9b50181f.js` → `AllOrNoneActionPotentialThresholdVisualization`.

#### Allolactose inactivates the operator-bound LacI repressor, allowing RNA polymerase to transcribe the lac structural genes.

Type `LAC_OPERON_INDUCER_REPRESSION_SWITCH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ccd61b53bbb0.js`; view `visualization-9cb25389c7ac.js` → `Visualization`.

#### Allopatric geographic separation versus sympatric shared habitat

The upper allopatric habitat is split by a continuous river; the lower sympatric habitat remains unbroken while its populations experience a reproductive gene-flow barrier.

Type `ALLOPATRIC_VERSUS_SYMPATRIC_SPECIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-88a050f8fd8d.js`; view `visualization-33287274c0e2.js` → `AllopatricVersusSympatricSpeciationVisualization`.

#### Alpha helices and beta sheets

Type `PROTEIN_SECONDARY_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4964ed0b7591.js`; view `visualization-fa72ed3671b6.js` → `ProteinSecondaryStructureVisualization`.

#### Alternative RNA-splicing isoforms

Type `ALTERNATIVE_RNA_SPLICING_ISOFORMS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f192ed5b50f7.js`; view `visualization-fff11a81301b.js` → `Visualization`.

#### Amino-acid carboxyl, amino, and zwitterion states

Type `BIOLOGICAL_CARBOXYL_AMINO_ZWITTERION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4574a5c56f9f.js`; view `visualization-949c3c3fe16f.js` → `Visualization`.

#### Amino-acid charge states across pH

Type `BIOLOGICAL_AMINO_ACID_PH_DEPENDENT_CHARGE_STATES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5b4c0775832e.js`; view `visualization-4ff232119793.js` → `Visualization`.

#### Amino-acid molecular structure

Type `AMINO_ACID_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-58a5e07040d8.js`; view `visualization-dc28ca1a903a.js` → `AminoAcidStructureVisualization`.

#### Amniotic egg and extraembryonic membranes

Amniotic egg and extraembryonic membranes: An amniotic egg encloses an embryo within a fluid-filled amnion, provides nutrients through a yolk sac, and includes an allantois extending toward the outer layer.

Type `ANIMAL_AMNIOTIC_EGG_MEMBRANES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b23f5a244906.js`; view `visualization-4251dbcbe144.js` → `AnimalAmnioticEggMembranesVisualization`.

#### Amniotic egg structure

Type `VERTEBRATE_AMNIOTIC_EGG_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ea66978c4070.js`; view `visualization-a092570f3757.js` → `Visualization`.

#### Amoeba phagocytosis

Type `AMOEBA_PHAGOCYTOSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f0cbe3382bff.js`; view `visualization-83879a6cc1e5.js` → `Visualization`.

#### An affected aa child proves both unaffected pedigree parents are Aa carriers

Type `MENDELIAN_AUTOSOMAL_RECESSIVE_PEDIGREE_CARRIER_INFERENCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4d9f48837c76.js`; view `visualization-bc9b0080ded2.js` → `Visualization`.

#### An affected X-linked dominant father transmits his affected X to every daughter and no son

Type `X_LINKED_DOMINANT_FATHER_DAUGHTER_TRANSMISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c705ba5329ea.js`; view `visualization-c2e035c23d32.js` → `XLinkedDominantFatherDaughterTransmissionVisualization`.

#### An ectotherm cools by choosing a shaded environmental microhabitat

Type `BEHAVIORAL_THERMOREGULATION_MICROHABITAT_CHOICE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-776db5ea682f.js`; view `visualization-7b128e57bf9b.js` → `BehavioralThermoregulationMicrohabitatChoiceVisualization`.

#### An enhancer-bound transcriptional activator loops one continuous DNA molecule toward a promoter, recruits RNA polymerase, and increases mRNA output.

Type `EUKARYOTIC_ENHANCER_PROMOTER_LOOPING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9d5acd2c2812.js`; view `visualization-3b2ae9dda3fd.js` → `Visualization`.

#### Angiosperm double fertilization

Follow two haploid sperm through one pollen tube into a flowering-plant ovule: one fuses with the haploid egg to form a diploid zygote, while the other joins two haploid polar nuclei to form triploid endosperm.

Type `ANGIOSPERM_DOUBLE_FERTILIZATION_EMBRYO_AND_ENDOSPERM` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-cbad57cb2e22.js`; view `visualization-438da9c8819d.js` → `AngiospermDoubleFertilizationEmbryoAndEndospermVisualization`.

#### Angiosperm flowers, fruit, and enclosed seeds

Trace one recognizable flower and its enclosed ovule through pollen landing, pollen-tube sperm delivery, fertilization, and development of that same ovary into a seed-containing fruit.

Type `ANGIOSPERM_FLOWER_FERTILIZATION_FRUIT_AND_SEEDS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-90bfb33d04c2.js`; view `visualization-6805d04976cd.js` → `AngiospermFlowerFertilizationFruitAndSeedsVisualization`.

#### Animal body axes and cephalization

Type `ANIMAL_BODY_AXES_AND_CEPHALIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d16e0a53fad2.js`; view `visualization-6c1d02ca1977.js` → `AnimalBodyAxesAndCephalizationVisualization`.

#### Animal cell structure and function

Type `ANIMAL_CELL_STRUCTURE_AND_FUNCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1b2e670dbd36.js`; view `visualization-390a276a1550.js` → `Visualization`.

#### Animal digestive tract organ sequence

Digestive tract anatomy with one continuous meal route from the mouth through the esophagus and stomach, into the nutrient-absorbing small intestine, and finally into the water-recovering colon.

Type `ANIMAL_DIGESTIVE_TRACT_ORGAN_SEQUENCE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-d0c6c533fe7a.js`; view `visualization-4332849dafce.js` → `AnimalDigestiveTractOrganSequenceVisualization`.

#### Animal diversity and body plans

Type `ANIMAL_DIVERSITY_AND_BODY_PLANS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a683f46ddd5d.js`; view `visualization-79fc6f840d5a.js` → `AnimalDiversityAndBodyPlansVisualization`.

#### Animal excretion and osmoregulation

Type `ANIMAL_EXCRETION_AND_OSMOREGULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-913cfe23625b.js`; view `visualization-658dd75e09d4.js` → `AnimalExcretionAndOsmoregulationVisualization`.

#### Animal extracellular-matrix components and integrin attachment

Animal cell with extracellular collagen fibers, a branched proteoglycan, and fibronectin linked through a membrane-spanning integrin to intracellular actin.

Type `EXTRACELLULAR_MATRIX_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1c3c1e0e2d72.js`; view `visualization-5b1e15209852.js` → `Visualization`.

#### Animal respiration uses food and oxygen and releases energy and waste

An animal uses food and oxygen to release usable energy while carbon dioxide and water leave as material waste.

Type `RESPIRATION_FOOD_OXYGEN_ENERGY_WASTE_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-806e954231f8.js`; view `visualization-504add65ce62.js` → `Visualization`.

#### Animal tight junctions seal, desmosomes anchor, and gap junctions connect

Two neighboring animal cells share an upper tight junction that seals, a middle desmosome that anchors intermediate filaments, and a lower gap junction that connects their cytoplasms.

Type `ANIMAL_CELL_JUNCTION_FUNCTIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6f6a8749d4cc.js`; view `visualization-5d6365dda26b.js` → `Visualization`.

#### Animal tissues, integument, and barrier repair

Type `ANIMAL_TISSUES_INTEGUMENT_AND_BARRIER_REPAIR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6e4674121c5a.js`; view `visualization-39a736509932.js` → `AnimalTissuesIntegumentAndBarrierRepairVisualization`.

#### Animal-cell cytokinesis divides cytoplasm after nuclear division

Type `ANIMAL_CELL_CYTOKINESIS_CLEAVAGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cb11e0c6fd49.js`; view `visualization-46cb4c2fb826.js` → `Visualization`.

#### Animal-cell swelling, balance, and shrinking across three tonicities

Type `ANIMAL_CELL_TONICITY_COMPARISON` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-f3dba7d97d54.js`; view `visualization-a617e27fc20c.js` → `Visualization`.

#### Annelid peristaltic locomotion

Type `ANIMAL_ANNELID_PERISTALTIC_LOCOMOTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7c7eccb9eb6a.js`; view `visualization-5b1deb50596a.js` → `AnimalAnnelidPeristalticLocomotionVisualization`.

#### Ant pheromone trail and food recruitment

Type `ANIMAL_PHEROMONE_TRAIL_RECRUITMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-af499b718fd6.js`; view `visualization-7d1cd7cc04ef.js` → `Visualization`.

#### Antagonistic elbow flexion and extension

Type `MUSCULOSKELETAL_ANTAGONISTIC_ELBOW_FLEXION_EXTENSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2997e16bf52b.js`; view `visualization-a86a9f9261d6.js` → `MusculoskeletalAntagonisticElbowFlexionExtensionVisualization`.

#### Antibiotic selection of resistant bacteria

Type `ANTIBIOTIC_SELECTION_RESISTANT_BACTERIA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-802b4dd6e13b.js`; view `visualization-26467b31d7b2.js` → `AntibioticSelectionResistantBacteriaVisualization`.

#### Antibody heavy chains, light chains, Fab, and Fc

How do an antibody's heavy and light chains create Fab binding arms and an Fc effector stem? Relate the two heavy chains and two light chains of an antibody monomer to its identical Fab antigen-binding sites, flexible hinge, and heavy-chain Fc effector region.

Type `ANTIBODY_HEAVY_LIGHT_CHAIN_FAB_FC_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-40eeb111c0e1.js`; view `visualization-4c121fd2cce4.js` → `AntibodyHeavyLightChainFabFcStructureVisualization`.

#### Antibody specificity and neutralization

Why does only a matching antibody block viral attachment? Explain how antigen-binding specificity allows a matching antibody to neutralize an extracellular virion by occupying a required host-attachment site.

Type `ANTIBODY_SPECIFICITY_AND_ANTIGEN_NEUTRALIZATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-ea3f8f53184e.js`; view `visualization-7f42a979d09b.js` → `AntibodySpecificityAndAntigenNeutralizationVisualization`.

#### Antigen presentation pathways

Why do MHC I and MHC II activate different T cells? Distinguish endogenous peptide presentation by MHC class I to CD8 cytotoxic T cells from exogenous peptide presentation by MHC class II to CD4 helper T cells.

Type `ANTIGEN_PRESENTATION_PATHWAYS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-97e3fb15672b.js`; view `visualization-d4ba96dbdf12.js` → `AntigenPresentationPathwaysVisualization`.

#### Antigen-specific clonal selection and expansion

How does one antigen select and expand its matching lymphocyte clone? Explain why only an antigen-matched lymphocyte undergoes clonal expansion and differentiates into effector and memory descendants with the same specificity.

Type `ANTIGEN_SPECIFIC_CLONAL_SELECTION_AND_EXPANSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-982dd19b2dc9.js`; view `visualization-e58518b7f1f5.js` → `AntigenSpecificClonalSelectionAndExpansionVisualization`.

#### Antiparallel AUG codon and UAC tRNA anticodon pairing

Type `CODON_ANTICODON_PAIRING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9769188bb6a1.js`; view `visualization-2361621acd5a.js` → `CodonAnticodonPairingVisualization`.

#### Antiparallel DNA strands

Two complementary DNA strands run antiparallel through a twisting double helix: one strand runs from 5-prime to 3-prime while its partner runs from 3-prime to 5-prime.

Type `ANTIPARALLEL_DNA_STRANDS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cfba3c82c3af.js`; view `visualization-9278c91f9c11.js` → `Visualization`.

#### Antiparallel template and daughter polarity

Type `DNA_REPLICATION_ANTIPARALLEL_TEMPLATE_POLARITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-51b2e3398223.js`; view `visualization-6e3a962fb974.js` → `DnaReplicationAntiparallelTemplatePolarityVisualization`.

#### Apical dominance auxin and cytokinin

Type `APICAL_DOMINANCE_AUXIN_CYTOKININ` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6c3282e07d05.js`; view `visualization-d83556c8f6a3.js` → `Visualization`.

#### Artery, vein, and capillary structure comparison

Static vessel comparison: an artery has a thick wall and narrower lumen, a vein has a thinner wall, wider lumen, and one-way valve, and a capillary has a thin exchange wall beside a body cell.

Type `ANIMAL_ARTERY_VEIN_CAPILLARY_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-652df7b8cca1.js`; view `visualization-2bf0609bb122.js` → `AnimalArteryVeinCapillaryStructureVisualization`.

#### Arthropod body plan and jointed appendages

Type `ANIMAL_ARTHROPOD_BODY_PLAN_JOINTED_APPENDAGES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-153bd2ef9e5e.js`; view `visualization-69299856f310.js` → `AnimalArthropodBodyPlanJointedAppendagesVisualization`.

#### Artificial selection and selective breeding

Type `ARTIFICIAL_SELECTION_SELECTIVE_BREEDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-942f711e0087.js`; view `visualization-9da3765f2b81.js` → `ArtificialSelectionSelectiveBreedingVisualization`.

#### Asexual plant propagation by runners

A parent flowering plant extends a horizontal above-ground runner, roots form at its node, and a connected new daughter plant grows without pollination or seed formation

Type `PLANT_ASEXUAL_RUNNER_PROPAGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2c26d444906d.js`; view `visualization-f6ed2ca2624c.js` → `Visualization`.

#### Asymmetric stem-cell division renews one stem cell and differentiates its sibling

Asymmetric stem-cell division and self-renewal: one stem cell produces a daughter that retains stem-cell identity and a sibling that differentiates into a neuron, while both daughters inherit the same genome.

Type `STEM_CELL_ASYMMETRIC_DIVISION_AND_SELF_RENEWAL` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-689b3aa08e59.js`; view `visualization-e465e607679a.js` → `Visualization`.

#### Atmospheric nitrogen, root-nodule bacteria, soil nitrogen, and feeding

How does atmospheric nitrogen become available to plants and then enter animals? Explain that nitrogen-fixing microbes convert atmospheric nitrogen gas into biologically available soil nitrogen before producers assimilate it and consumers acquire it by feeding.

Type `BIOGEOCHEMICAL_NITROGEN_FIXATION_AND_ASSIMILATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-54c26514e9b7.js`; view `visualization-21ad2258ab38.js` → `Visualization`.

#### ATP and ADP preserve adenosine while one phosphate changes attachment

ATP and ADP structure comparison: both molecules retain the same adenosine scaffold; ATP has three attached phosphate groups, while ADP has two and a separate conserved inorganic phosphate.

Type `ATP_ADP_PHOSPHATE_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fb2a1f973b3d.js`; view `visualization-610c60778b0d.js` → `AtpAdpPhosphateStructureVisualization`.

#### ATP hydrolysis transfers one phosphate and metabolic energy regenerates ATP

ATP hydrolysis and regeneration animation: one conserved terminal phosphate leaves ATP as cellular work occurs, then energy input returns that same phosphate to ADP and regenerates ATP.

Type `ATP_HYDROLYSIS_AND_REGENERATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8300643c305a.js`; view `visualization-3c09e14f8e5f.js` → `AtpHydrolysisAndRegenerationVisualization`.

#### ATP phosphorylation activates a substrate and enables a new chemical bond

ATP-coupled chemical work animation: the same terminal ATP phosphate transfers to a substrate, creating an activated intermediate that enables a new product bond.

Type `PHOSPHORYLATION_COUPLED_CELLULAR_WORK` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2d1673cb9409.js`; view `visualization-2577205b6699.js` → `PhosphorylationCoupledCellularWorkVisualization`.

#### ATP synthase chemiosmosis

Type `ATP_SYNTHASE_CHEMIOSMOSIS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-6cbf6f94a417.js`; view `visualization-b4ea3f62889c.js` → `AtpSynthaseChemiosmosisVisualization`.

#### ATP-dependent cross-bridge cycle

Type `MUSCULOSKELETAL_ATP_CROSS_BRIDGE_CYCLE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-39a8560c3bfb.js`; view `visualization-3f678fb26a5e.js` → `MusculoskeletalAtpCrossBridgeCycleVisualization`.

#### ATP-derived phosphate activates a membrane pump before against-gradient ion transport

ATP-driven active transport animation: ATP-derived phosphate activates a membrane pump, then one identifiable ion moves through its pore from lower concentration to higher concentration.

Type `ATP_DRIVEN_ACTIVE_TRANSPORT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c7ea28e4ea8e.js`; view `visualization-c02cc9c1eb34.js` → `AtpDrivenActiveTransportVisualization`.

#### Auditory hair-cell sensory transduction

Type `SENSORY_AUDITORY_HAIR_CELL_TRANSDUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9870c8ab5420.js`; view `visualization-74531d1e9274.js` → `Visualization`.

#### Autophagy encloses damaged cargo for lysosomal recycling

Type `AUTOPHAGY_LYSOSOME_RECYCLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-678887ccf7d8.js`; view `visualization-1f8313f5234e.js` → `Visualization`.

#### Autosomal dominant vertical transmission contrasted with recessive transmission through an unaffected carrier generation

Type `MENDELIAN_AUTOSOMAL_DOMINANT_VERSUS_RECESSIVE_PEDIGREE_PATTERNS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8f7ed7ae3194.js`; view `visualization-85c17b91f23b.js` → `Visualization`.

#### Autosomal father-to-son transmission contrasted with paternal X-to-daughter transmission

Type `MENDELIAN_AUTOSOMAL_VERSUS_X_LINKED_PEDIGREE_TRANSMISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-71af11eb5df9.js`; view `visualization-9666c7674d45.js` → `Visualization`.

#### Auxin acid-growth cell elongation

Type `AUXIN_ACID_GROWTH_CELL_ELONGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1805cba087c8.js`; view `visualization-3d5a0e15cd5a.js` → `Visualization`.

#### B-cell plasma-cell antibody secretion

How does an activated B cell produce protective antibodies? Connect antigen-specific B-cell activation to plasma-cell differentiation and secretion of antibodies with the same recognition specificity.

Type `B_CELL_PLASMA_CELL_ANTIBODY_SECRETION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b5c2097cd130.js`; view `visualization-3315cdcb780d.js` → `BCellPlasmaCellAntibodySecretionVisualization`.

#### Bacterial and animal cells share core structures but differ in nuclear organization

Bacterial and animal cells both have a membrane, cytoplasm, DNA, and ribosomes. Bacterial DNA is not enclosed in a nucleus, while animal-cell DNA is enclosed within a nucleus.

Type `CELL_THEORY_PROKARYOTIC_AND_EUKARYOTIC_CELLS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2984118d783e.js`; view `visualization-a00f4be30928.js` → `Visualization`.

#### Bacterial batch-culture growth phases

Type `BACTERIAL_BATCH_CULTURE_GROWTH_PHASES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f5bd8d82824c.js`; view `visualization-109be0a0856f.js` → `BacterialBatchCultureGrowthPhasesVisualization`.

#### Bacterial binary fission

Type `BACTERIAL_BINARY_FISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-22c63a9cd888.js`; view `visualization-f0bfbe5bb574.js` → `BacterialBinaryFissionVisualization`.

#### Bacterial cell envelope and accessory structures

Type `BACTERIAL_CELL_ENVELOPE_AND_ACCESSORY_STRUCTURES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a79469a0080a.js`; view `visualization-84af9cdddf6b.js` → `BacterialCellEnvelopeAndAccessoryStructuresVisualization`.

#### Bacterial cell shapes and arrangements

Type `BACTERIAL_CELL_SHAPES_AND_ARRANGEMENTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ba757dc9e400.js`; view `visualization-2ecc0869171e.js` → `BacterialCellShapesAndArrangementsVisualization`.

#### Bacterial conjugation and plasmid transfer

Type `BACTERIAL_CONJUGATION_PLASMID_TRANSFER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-da50844dbb13.js`; view `visualization-661616fe939d.js` → `BacterialConjugationPlasmidTransferVisualization`.

#### Bacterial horizontal gene transfer routes

Type `BACTERIAL_HORIZONTAL_GENE_TRANSFER_ROUTES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4842463d2b9c.js`; view `visualization-a7bb19daf694.js` → `BacterialHorizontalGeneTransferRoutesVisualization`.

#### Bacterial operons and eukaryotic chromatin, transcription, and RNA processing regulate the unchanged pathway from DNA to RNA to protein.

Type `GENE_EXPRESSION_REGULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5205086ad8f2.js`; view `visualization-dbb0a1cf6306.js` → `Visualization`.

#### Bacterial population density triggers a shared quorum-sensing response

Type `BACTERIAL_QUORUM_SENSING_DENSITY_THRESHOLD` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-c03b23303f20.js`; view `visualization-2a1ad5b6d238.js` → `BacterialQuorumSensingDensityThresholdVisualization`.

#### Bacterial prophage induction

Type `BACTERIAL_PROPHAGE_INDUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-58c4175b99e7.js`; view `visualization-1171fa1e938f.js` → `BacterialProphageInductionVisualization`.

#### Bacterial transformation and antibiotic selection

Two comparable bacterial hosts face equal visibly counted antibiotic doses; only the plasmid-positive cell contains the marked resistance gene and survives, while the plasmid-negative host is inhibited.

Type `BACTERIAL_TRANSFORMATION_ANTIBIOTIC_SELECTION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-1a2c38f9cd50.js`; view `visualization-fcdf3903963a.js` → `Visualization`.

#### Bacterial transformation and free DNA uptake

Type `BACTERIAL_TRANSFORMATION_FREE_DNA_UPTAKE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-42af29e28dc1.js`; view `visualization-181656b0d30f.js` → `BacterialTransformationFreeDnaUptakeVisualization`.

#### Bacteriophage attachment and genome injection

Type `BACTERIOPHAGE_ATTACHMENT_AND_GENOME_INJECTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-10a9f2c0fc13.js`; view `visualization-2bdb3341497d.js` → `BacteriophageAttachmentAndGenomeInjectionVisualization`.

#### Bacteriophage lysogeny and prophage inheritance

Type `BACTERIOPHAGE_LYSOGENY_AND_PROPHAGE_INHERITANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-909470642d06.js`; view `visualization-6f74c6468d3d.js` → `BacteriophageLysogenyAndProphageInheritanceVisualization`.

#### Bacteriophage lytic replication and lysis

Type `BACTERIOPHAGE_LYTIC_REPLICATION_AND_LYSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3d08c7be808d.js`; view `visualization-343a2831e0a8.js` → `BacteriophageLyticReplicationAndLysisVisualization`.

#### Bacteriophage lytic versus lysogenic pathways

Type `BACTERIOPHAGE_LYTIC_VERSUS_LYSOGENIC_PATHWAYS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-ffec32f63499.js`; view `visualization-6906dc85814f.js` → `BacteriophageLyticVersusLysogenicPathwaysVisualization`.

#### Bacteriophage structure and host recognition

Type `BACTERIOPHAGE_STRUCTURE_AND_HOST_RECOGNITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ab95f7c62d15.js`; view `visualization-5b2d2133e341.js` → `BacteriophageStructureAndHostRecognitionVisualization`.

#### Bacteriophage transduction of bacterial genes

Type `BACTERIOPHAGE_TRANSDUCTION_BACTERIAL_GENE_TRANSFER` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-77cc63d10a98.js`; view `visualization-8d491604fe80.js` → `BacteriophageTransductionBacterialGeneTransferVisualization`.

#### Basal melanocytes transfer protective melanin

Type `EPIDERMAL_MELANOCYTE_MELANIN_UV_PROTECTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6d75a72828bb.js`; view `visualization-dad413113669.js` → `EpidermalMelanocyteMelaninUvProtectionVisualization`.

#### Bidirectional replication forks

Type `DNA_REPLICATION_ORIGIN_BIDIRECTIONAL_FORKS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2eab92721c8d.js`; view `visualization-10424ff70c7f.js` → `DnaReplicationOriginBidirectionalForksVisualization`.

#### Bile emulsifies fat before lipase digests exposed droplet surfaces

Fat digestion animation: bile first disperses one large fat droplet into multiple smaller droplets with greater combined surface, then lipase acts at those droplet surfaces and releases smaller digestion products; bile is not an enzyme.

Type `ANIMAL_BILE_EMULSIFICATION_AND_FAT_DIGESTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2d8109ac9cd3.js`; view `visualization-f84ed9dfa384.js` → `AnimalBileEmulsificationAndFatDigestionVisualization`.

#### Biological acid-base proton transfer

Type `BIOLOGICAL_ACID_BASE_PROTON_TRANSFER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9c1e4e00b6d6.js`; view `visualization-96aa9175846e.js` → `Visualization`.

#### Biological bicarbonate buffer equilibrium

Type `BIOLOGICAL_BICARBONATE_BUFFER_EQUILIBRIUM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7be157d7b26f.js`; view `visualization-2923b6cdbb2d.js` → `Visualization`.

#### Biological buffer capacity and exhaustion

Type `BIOLOGICAL_BUFFER_CAPACITY_AND_EXHAUSTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-69b19a38a764.js`; view `visualization-4b4fb5f725e4.js` → `Visualization`.

#### Biological buffer conjugate pair

Type `BIOLOGICAL_BUFFER_CONJUGATE_PAIR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8eeb77b86b9e.js`; view `visualization-f0673a28df1f.js` → `Visualization`.

#### Biological buffer response to added acid

Type `BIOLOGICAL_BUFFER_ADDED_ACID_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-64bc0103213d.js`; view `visualization-215c63eaf887.js` → `Visualization`.

#### Biological buffer response to added base

Type `BIOLOGICAL_BUFFER_ADDED_BASE_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-acd416fdb720.js`; view `visualization-876420998f39.js` → `Visualization`.

#### Biological calibration curve and unknown concentration

Type `BIOLOGICAL_CALIBRATION_CURVE_AND_UNKNOWN_CONCENTRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b35c39150721.js`; view `visualization-cc58878322d9.js` → `BiologicalCalibrationCurveAndUnknownConcentrationVisualization`.

#### Biological pH scale and tenfold proton changes

Type `BIOLOGICAL_PH_SCALE_TENFOLD_PROTON_CHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-688c92b9a52f.js`; view `visualization-b63849b102e1.js` → `Visualization`.

#### Biological pH, pKa, and protonation states

Type `BIOLOGICAL_PH_PKA_PROTONATION_STATES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f1b3351f62a6.js`; view `visualization-6e977640750c.js` → `Visualization`.

#### Biological serial dilution and concentration

Type `BIOLOGICAL_SERIAL_DILUTION_AND_CONCENTRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7187246792b9.js`; view `visualization-d0af1c9a4445.js` → `BiologicalSerialDilutionAndConcentrationVisualization`.

#### Biotechnology methods

One DNA-centered biotechnology map shows four countable PCR copies, three size-separated gel bands, a conspicuous donor-bearing plasmid inside a bacterial host, and a recognizable guide-directed Cas9 beside its cut DNA product.

Type `BIOTECHNOLOGY` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-ac7b8cda010c.js`; view `visualization-bf1c01633881.js` → `Visualization`.

#### Birds nested within reptiles

Type `VERTEBRATE_BIRDS_NESTED_WITHIN_REPTILES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-938843672aa6.js`; view `visualization-83a796947632.js` → `Visualization`.

#### Births, deaths, immigration, and emigration

Type `POPULATION_ECOLOGY_DEMOGRAPHIC_CHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4f8dca8d977d.js`; view `visualization-13697d6fa52e.js` → `Visualization`.

#### Blastocyst implantation and cell lineages

Blastocyst implantation and cell lineages: A mammalian blastocyst contains an outer trophoblast, a fluid-filled cavity, and an inner cell mass. During implantation the trophoblast contacts and invades the endometrium and contributes to the fetal component of the placenta, while the inner cell mass develops into the embryo.

Type `ANIMAL_BLASTOCYST_IMPLANTATION_CELL_LINEAGES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ce928739d071.js`; view `visualization-c3b150551675.js` → `AnimalBlastocystImplantationCellLineagesVisualization`.

#### Both plants and animals use food and oxygen for respiration

A whole plant and a whole animal both use food and oxygen for respiration, releasing energy, carbon dioxide, and water.

Type `PLANTS_AND_ANIMALS_BOTH_RESPIRE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-919f80337893.js`; view `visualization-5cff910036c8.js` → `Visualization`.

#### Branching timeline of major biological transitions

Type `BRANCHING_TIMELINE_OF_MAJOR_BIOLOGICAL_TRANSITIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-89d21841567a.js`; view `visualization-d4b54fced801.js` → `BranchingTimelineOfMajorBiologicalTransitionsVisualization`.

#### Bread mold sporangium spore release

Type `BREAD_MOLD_SPORANGIUM_SPORE_RELEASE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-47746364e6cc.js`; view `visualization-63d2b203d1ee.js` → `Visualization`.

#### Brightfield versus phase-contrast imaging of one unstained live cell

Type `MICROSCOPY_PHASE_CONTRAST_LIVE_CELLS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d42c0dca9d86.js`; view `visualization-7efd18d1a916.js` → `Visualization`.

#### Butterfly complete metamorphosis

Butterfly complete metamorphosis: an egg becomes a caterpillar larva, then a chrysalis pupa, then an adult butterfly that produces new eggs.

Type `ORGANISM_BUTTERFLY_COMPLETE_METAMORPHOSIS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-742afae4dfb8.js`; view `visualization-ca40fe74e1d1.js` → `OrganismButterflyCompleteMetamorphosisVisualization`.

#### Calcium, troponin, and tropomyosin

Type `MUSCULOSKELETAL_CALCIUM_TROPONIN_TROPOMYOSIN` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3707ba102b13.js`; view `visualization-6bebe29ba057.js` → `MusculoskeletalCalciumTroponinTropomyosinVisualization`.

#### Calvin cycle: carbon dioxide, RuBP, G3P, and regenerated RuBP

Type `PHOTOSYNTHESIS_CALVIN_CYCLE_CARBON_FIXATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-f142f4215cdc.js`; view `visualization-26a265d3c63f.js` → `Visualization`.

#### Cambrian animal body-plan diversification

Type `CAMBRIAN_ANIMAL_BODY_PLAN_DIVERSIFICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b439c29dc06d.js`; view `visualization-56324689fef7.js` → `CambrianAnimalBodyPlanDiversificationVisualization`.

#### Carbohydrate structure and function

Type `CARBOHYDRATE_STRUCTURE_FUNCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3ed86fb590b6.js`; view `visualization-a8b973bdb91c.js` → `Visualization`.

#### Carbohydrates overview

Type `CARBOHYDRATES_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f11541ad36ff.js`; view `visualization-c40d5cf27dfb.js` → `Visualization`.

#### Carbon dioxide right-shifts the hemoglobin oxygen affinity curve

Bohr-effect comparison: normal and high-carbon-dioxide lower-pH hemoglobin saturation curves share the same axes; the high-carbon-dioxide curve shifts right, has lower saturation at one identical tissue oxygen availability, and therefore releases more oxygen to active tissue.

Type `ANIMAL_BOHR_EFFECT_AND_OXYGEN_UNLOADING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8d29529847e2.js`; view `visualization-3a5931d26666.js` → `AnimalBohrEffectAndOxygenUnloadingVisualization`.

#### Carbon dioxide, bicarbonate transport, and blood pH

Carbon dioxide and blood-pH animation: carbon dioxide from body tissue enters blood, reversibly forms bicarbonate and a buffered hydrogen ion during transport, then bicarbonate and hydrogen ion recombine at the lungs before carbon dioxide leaves; more hydrogen ions are associated with lower pH.

Type `ANIMAL_CARBON_DIOXIDE_BICARBONATE_AND_PH` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-bebbb05ab922.js`; view `visualization-7e23ee31be50.js` → `AnimalCarbonDioxideBicarbonateAndPhVisualization`.

#### Carbon from air becomes plant sugar and new leaf tissue

Carbon dioxide enters a plant leaf, and the same carbon becomes part of sugar and newly growing leaf tissue.

Type `PLANT_GROWTH_CARBON_FROM_AIR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ee194e125de6.js`; view `visualization-96ab33f9b522.js` → `Visualization`.

#### Carbon reservoirs and fluxes

Where is carbon stored, and which pathways move it among air, organisms, soil, and water? Distinguish major carbon reservoirs from the biological and physical fluxes that transfer the same carbon among them.

Type `BIOGEOCHEMICAL_CARBON_RESERVOIRS_AND_FLUXES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3287a0c0c401.js`; view `visualization-8f10d8cee1b5.js` → `Visualization`.

#### carbon-budget-emission-reduction-and-sink-restoration

Type `CARBON_BUDGET_EMISSION_REDUCTION_AND_SINK_RESTORATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-319095e210a6.js`; view `visualization-52f462b4cce9.js` → `CarbonBudgetEmissionReductionAndSinkRestorationVisualization`.

#### carbon-cycle-anthropogenic-imbalance

Type `CARBON_CYCLE_ANTHROPOGENIC_IMBALANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2b6dbe275ed6.js`; view `visualization-73625e56451c.js` → `CarbonCycleAnthropogenicImbalanceVisualization`.

#### Carrier mother and unaffected father produce one affected X-linked son

Type `X_LINKED_RECESSIVE_INHERITANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8c8ad4f8dce7.js`; view `visualization-de86c20ae560.js` → `XLinkedRecessiveInheritanceVisualization`.

#### Cell specialization: same genome, different cellular identities

Cell specialization: nerve, muscle, and protein-secretory cells share the same DNA but express different genes and have different structures and functions.

Type `CELL_SPECIALIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2848b8bd66c0.js`; view `visualization-b3b5593e6a15.js` → `Visualization`.

#### Cell theory: living things, cellular units, and existing-cell lineage

Animal, plant, and bacterial cells show that all living things consist of cells and that a cell is the basic unit of life; one existing parent cell leads to two daughter cells.

Type `CELL_THEORY_EVIDENCE_AND_SCALE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5489280ca726.js`; view `visualization-4c3b5750b088.js` → `Visualization`.

#### Cell-cycle phases and regulation overview

Type `CELL_CYCLE_AND_REGULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c0c1b64d21f0.js`; view `visualization-2b9442defcde.js` → `Visualization`.

#### Cell-size surface area, volume, and SA:V comparison

Type `CELL_SIZE_SURFACE_AREA_TO_VOLUME` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-831f7c46dd63.js`; view `visualization-7a8e1843cd9b.js` → `CellSizeSurfaceAreaToVolumeVisualization`.

#### Cell-specific transcription factors activate matching genes in the same genome

Cell-specific transcription factors: a nerve cell and muscle cell retain the same regulatory DNA, but different matching transcription factors activate different target genes.

Type `CELL_TYPE_SPECIFIC_TRANSCRIPTION_FACTORS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4f9c4bf41a5b.js`; view `visualization-cff008b334eb.js` → `Visualization`.

#### Cell-surface movement and cytoskeleton

Explain how actin filaments, microtubules, and intermediate filaments organize a cell and support intracellular transport and cell-surface movement.

Type `CELL_SURFACE_MOVEMENT_AND_CYTOSKELETON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6cf922fb666d.js`; view `visualization-dd340a57e5fc.js` → `Visualization`.

#### Cellular respiration pathway overview

Type `CELLULAR_RESPIRATION_PATHWAY_OVERVIEW` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-ac534fbf2909.js`; view `visualization-dc727d4c504c.js` → `CellularRespirationPathwayOverviewVisualization`.

#### Cellular structure and functions

Type `CELLULAR_STRUCTURE_AND_FUNCTIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cca2d1279025.js`; view `visualization-616be6be465d.js` → `Visualization`.

#### Central and peripheral nervous-system organization

The brain and spinal cord form the central nervous system. The peripheral nervous system carries sensory input inward and branches into somatic and autonomic motor output.

Type `NERVOUS_SYSTEM_CENTRAL_PERIPHERAL_ORGANIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9c47921fc211.js`; view `visualization-c9de85f610e2.js` → `NervousSystemCentralPeripheralOrganizationVisualization`.

#### Checkpoint failure inherits DNA damage through repeated cell division

Type `CHECKPOINT_FAILURE_UNCONTROLLED_PROLIFERATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8a0ed2c5e436.js`; view `visualization-1be793ace3aa.js` → `Visualization`.

#### Chemical-synapse neurotransmitter release

A presynaptic action potential opens a calcium channel. Calcium enters, a neurotransmitter-filled vesicle fuses with the presynaptic membrane, transmitter crosses the synaptic cleft, and a postsynaptic receptor produces a local response.

Type `CHEMICAL_SYNAPSE_NEUROTRANSMITTER_RELEASE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6d9e9c0bd954.js`; view `visualization-ee61e3fe42ff.js` → `ChemicalSynapseNeurotransmitterReleaseVisualization`.

#### Chloroplast structure and photosynthesis

Type `CHLOROPLAST_STRUCTURE_AND_PHOTOSYNTHESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3ee19e5c3b04.js`; view `visualization-d5a07cc0b644.js` → `Visualization`.

#### Cholesterol buffers cool packing and warm membrane motion

Type `CHOLESTEROL_MEMBRANE_FLUIDITY` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-fe38f4b848ea.js`; view `visualization-9a03706a60e2.js` → `CholesterolMembraneFluidityVisualization`.

#### Chromosome-21 nondisjunction produces a 24-chromosome gamete; fertilization by a normal 23-chromosome gamete produces trisomy 21

Type `MEIOTIC_NONDISJUNCTION_FERTILIZATION_TRISOMY` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-f023a589001e.js`; view `visualization-30b64c7e5f4a.js` → `Visualization`.

#### Cilia versus microvilli

Distinguish motile microtubule-based cilia that move material from shorter actin-supported microvilli that increase absorptive surface area.

Type `CILIA_VERSUS_MICROVILLI` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-45f2294a8894.js`; view `visualization-f048e7c1c2c5.js` → `Visualization`.

#### Ciliary power and recovery stroke

Explain how a motile cilium's effective power stroke and bent recovery stroke create net movement of material over a cell surface.

Type `CILIARY_POWER_AND_RECOVERY_STROKE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1fc17825b632.js`; view `visualization-e82004cf02ae.js` → `Visualization`.

#### Circadian melatonin neuroendocrine pathway

Type `CIRCADIAN_MELATONIN_NEUROENDOCRINE_PATHWAY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c488b3fb18f1.js`; view `visualization-b0fc0c7c2366.js` → `Visualization`.

#### Citric acid cycle carbon and carriers

Type `CITRIC_ACID_CYCLE_CARBON_AND_CARRIERS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-191aa237339d.js`; view `visualization-f0a8f38e154b.js` → `CitricAcidCycleCarbonAndCarriersVisualization`.

#### climate-disruption-coral-bleaching

Type `CLIMATE_DISRUPTION_CORAL_BLEACHING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1eaf975bddf6.js`; view `visualization-8cf84f2598a1.js` → `ClimateDisruptionCoralBleachingVisualization`.

#### climate-disruption-species-range-shift

Type `CLIMATE_DISRUPTION_SPECIES_RANGE_SHIFT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5dea8a6cd756.js`; view `visualization-fb42ed836ecb.js` → `ClimateDisruptionSpeciesRangeShiftVisualization`.

#### Cnidarian nematocyst discharge

Type `ANIMAL_CNIDARIAN_NEMATOCYST_DISCHARGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5d401172ede9.js`; view `visualization-e02e81d96296.js` → `AnimalCnidarianNematocystDischargeVisualization`.

#### Cnidarian polyp versus medusa

Type `ANIMAL_CNIDARIAN_POLYP_VERSUS_MEDUSA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8ffd188b1903.js`; view `visualization-44533f5eb27e.js` → `AnimalCnidarianPolypVersusMedusaVisualization`.

#### Cochlear tonotopic pitch mapping

Type `SENSORY_COCHLEAR_TONOTOPIC_PITCH_MAPPING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-435abf75f508.js`; view `visualization-1207ede0996d.js` → `Visualization`.

#### Coding and template DNA strands determine transcription direction

Type `GENE_CODING_TEMPLATE_STRAND_ORIENTATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-0d5a93fdaa3f.js`; view `visualization-ef81fac67e1b.js` → `GeneCodingTemplateStrandOrientationVisualization`.

#### Coding strand template strand and RNA comparison

Type `CODING_TEMPLATE_RNA_STRAND_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cd83bfb62ac5.js`; view `visualization-c793e8dcf964.js` → `Visualization`.

#### Commensalism nesting partnership

Type `COMMENSALISM_NESTING_PARTNERSHIP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7503dd5d9f07.js`; view `visualization-40a097ebdaeb.js` → `CommensalismNestingPartnershipVisualization`.

#### Comparative vertebrate embryology

Type `EVOLUTION_COMPARATIVE_EMBRYOLOGY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-615085e849cf.js`; view `visualization-5f38652a6871.js` → `EvolutionComparativeEmbryologyVisualization`.

#### Compare internal metabolic heat and external environmental heat

Type `ENDOTHERM_ECTOTHERM_HEAT_SOURCE_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c3fe6c2472a2.js`; view `visualization-2215a18bee09.js` → `EndothermEctothermHeatSourceComparisonVisualization`.

#### Compare oriented taxis with nondirectional kinesis

Type `TAXIS_VERSUS_KINESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c3ff970cc858.js`; view `visualization-c787105a2362.js` → `TaxisVersusKinesisVisualization`.

#### Compare phylogenetic relatedness

Type `PHYLOGENETIC_RELATEDNESS_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dfa112eb3084.js`; view `visualization-1aa3a2c2f349.js` → `Visualization`.

#### Competitive and pure noncompetitive inhibition have distinct rate limits

Type `ENZYME_INHIBITION_KINETICS_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-215b73e31187.js`; view `visualization-ed04ceb8e9f3.js` → `Visualization`.

#### Complement opsonization

How do complement tags make a pathogen easier for phagocytes to recognize? Explain how deposited complement proteins opsonize a pathogen and improve recognition by a phagocyte's complement receptors.

Type `COMPLEMENT_OPSONIZATION_PHAGOCYTE_RECOGNITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2743436748f9.js`; view `visualization-b5408455fd81.js` → `ComplementOpsonizationPhagocyteRecognitionVisualization`.

#### Complementary base pairing

In DNA, adenine pairs specifically with thymine, and guanine pairs specifically with cytosine.

Type `COMPLEMENTARY_BASE_PAIRING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-184ee5d16a84.js`; view `visualization-a48fa75e5559.js` → `Visualization`.

#### Complementary cell-surface recognition produces physical adhesion

Two animal cells approach until a branching surface carbohydrate tag recognizes a complementary binding protein, leaving their membranes physically attached through matching external molecules.

Type `CELL_SURFACE_RECOGNITION_ADHESION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4a95909092dd.js`; view `visualization-842687a7e78d.js` → `Visualization`.

#### Complete phosphorus reservoirs and return pathways

How do biological recycling and geological return connect one complete phosphorus cycle? Compare connected rock, soil, producer, consumer, decomposer, water, and sediment reservoirs with rapid biological and slower geological phosphate return.

Type `BIOGEOCHEMICAL_PHOSPHORUS_RESERVOIRS_AND_RETURN_PATHWAYS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a557c884f6f0.js`; view `visualization-5b0faa60bae4.js` → `Visualization`.

#### Complete versus incomplete metamorphosis

Complete metamorphosis has egg, larva, pupa, and adult butterfly; incomplete metamorphosis has egg, nymph, and adult grasshopper with no pupa.

Type `ORGANISM_COMPLETE_VERSUS_INCOMPLETE_METAMORPHOSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-43e787595df8.js`; view `visualization-1b6b9bbce701.js` → `OrganismCompleteVersusIncompleteMetamorphosisVisualization`.

#### Complete water reservoirs and branching return pathways

How do atmospheric, plant, surface, and groundwater pathways form one branching water cycle? Compare evaporation, plant transpiration, precipitation, surface runoff, infiltration, and connected groundwater discharge in one complete water-cycle landscape.

Type `BIOGEOCHEMICAL_WATER_RESERVOIRS_AND_PATHWAYS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1dcba4f5b8e9.js`; view `visualization-470a93711437.js` → `Visualization`.

#### Compound microscope anatomy

Type `MICROSCOPY_COMPOUND_MICROSCOPE_ANATOMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1c20da86be71.js`; view `visualization-2f9223f9166b.js` → `Visualization`.

#### Concentration gradient and dynamic equilibrium

Type `CONCENTRATION_GRADIENT_EQUILIBRIUM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d224d9727c3f.js`; view `visualization-3a4cbbf0d07b.js` → `Visualization`.

#### Connective tissue cells, fibers, and matrix

Type `ANIMAL_CONNECTIVE_TISSUE_CELLS_FIBERS_MATRIX` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fb4a17bf09e8.js`; view `visualization-a44cadac76f6.js` → `AnimalConnectiveTissueCellsFibersMatrixVisualization`.

#### Connective tissue matrix comparison

Type `CONNECTIVE_TISSUE_LOOSE_DENSE_ADIPOSE_BLOOD_MATRIX` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5cb90db1e742.js`; view `visualization-88b5c42e4416.js` → `ConnectiveTissueLooseDenseAdiposeBloodMatrixVisualization`.

#### Conservation population size, inherited diversity, and habitat connectivity

Type `BIODIVERSITY_CONSERVATION_POPULATION_RISK` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-87446c096512.js`; view `visualization-904dc93503a7.js` → `Visualization`.

#### Contained apoptotic bodies compared with accidental necrotic rupture

Type `APOPTOSIS_VERSUS_NECROSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b4b476228285.js`; view `visualization-5cf869aba622.js` → `Visualization`.

#### Continuous leading-strand synthesis

Type `DNA_REPLICATION_LEADING_STRAND_SYNTHESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4482ddc667d8.js`; view `visualization-a67c80ce5ca6.js` → `DnaReplicationLeadingStrandSynthesisVisualization`.

#### Conventional pedigree symbols, connected generations, and carrier states

Type `MENDELIAN_PEDIGREE_SYMBOLS_AND_GENERATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2a06bceb3c0b.js`; view `visualization-b798d628e6b2.js` → `Visualization`.

#### Convergent aquatic vertebrate body shapes

Type `VERTEBRATE_CONVERGENT_AQUATIC_BODY_SHAPES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c275a732f227.js`; view `visualization-b01434ede3dc.js` → `Visualization`.

#### Corneocytes and lipids limit epidermal water loss

Type `EPIDERMAL_CORNEOCYTES_LIPID_WATER_BARRIER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4a91b425b9ac.js`; view `visualization-4f64a269b04c.js` → `EpidermalCorneocytesLipidWaterBarrierVisualization`.

#### Cortical versus juxtamedullary nephron

Type `CORTICAL_VERSUS_JUXTAMEDULLARY_NEPHRON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c128a7643419.js`; view `visualization-c87f9f1c8d04.js` → `CorticalVersusJuxtamedullaryNephronVisualization`.

#### CRISPR DNA repair outcomes

One CRISPR-generated double-strand DNA break branches into an NHEJ product containing a small indel and an HDR product containing a clearly identifiable sequence copied from a homologous donor template.

Type `CRISPR_DNA_REPAIR_OUTCOMES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1cf5b0f2b9a6.js`; view `visualization-876c54df3d48.js` → `Visualization`.

#### CRISPR guide-directed DNA cleavage

A recognizable Cas9 protein and its guide RNA move together to an intact PAM-adjacent DNA target; Cas9 cuts both strands and remains visible beside the held double-strand break.

Type `CRISPR_GUIDE_DIRECTED_DNA_CLEAVAGE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-90d0cb4ffb61.js`; view `visualization-70afcee75496.js` → `Visualization`.

#### CRISPR-Cas9 target recognition

A recognizable folded Cas9 protein holds a guide RNA base-paired to one target DNA strand, with an intact adjacent PAM and a distinct cleavage marker upstream of that PAM.

Type `CRISPR_CAS9_TARGET_RECOGNITION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-4f238c17a2a5.js`; view `visualization-3f12cda5c16b.js` → `Visualization`.

#### Cytokinin divides an attached lateral bud into a leafy side shoot

Type `CYTOKININ_CELL_DIVISION_AND_BUD_GROWTH` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-abce2ea9e6f8.js`; view `visualization-34b7d7f0d6f7.js` → `Visualization`.

#### Cytoskeletal filament comparison

Distinguish actin filaments, intermediate filaments, and microtubules by their approximate diameters, construction, and characteristic cellular roles.

Type `CYTOSKELETAL_FILAMENT_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-51b65abd2af6.js`; view `visualization-d071502aa16b.js` → `Visualization`.

#### Cytotoxic T-cell infected-cell killing

How does a cytotoxic T cell remove a virus-infected host cell? Follow an ordinary infected host cell through specific peptide-MHC I recognition, CD8 contact, targeted apoptosis, and disappearance of both the target and its virus while the CD8 T cell survives.

Type `CYTOTOXIC_T_CELL_INFECTED_CELL_KILLING` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-5bf56dfcdd91.js`; view `visualization-6a44a815f946.js` → `CytotoxicTCellInfectedCellKillingVisualization`.

#### Damaged cell undergoes contained apoptosis while its healthy neighbor survives

Type `PROGRAMMED_CELL_DEATH_APOPTOSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5d3c82dc48a7.js`; view `visualization-da43739e0ce0.js` → `Visualization`.

#### Damaged DNA arrests G1 until repair permits S-phase entry

Type `G1_DNA_DAMAGE_CHECKPOINT_ARREST` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a2eb70ab697d.js`; view `visualization-171ff240a5e8.js` → `Visualization`.

#### Daylight entrains an approximately daily organismal activity rhythm

Type `CIRCADIAN_RHYTHM_LIGHT_ENTRAINMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8361d3883c3e.js`; view `visualization-bcca063f6f5d.js` → `CircadianRhythmLightEntrainmentVisualization`.

#### Decomposer nutrient recycling

Type `DECOMPOSER_NUTRIENT_RECYCLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6bc6cf95ae61.js`; view `visualization-ce6876297c58.js` → `Visualization`.

#### Deep time and the Precambrian–Phanerozoic scale

Type `GEOLOGIC_DEEP_TIME_PRECAMBRIAN_PHANEROZOIC_SCALE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a3f39ff38550.js`; view `visualization-2acae6e5829e.js` → `GeologicDeepTimePrecambrianPhanerozoicScaleVisualization`.

#### Dendritic-cell antigen presentation

How does a dendritic cell activate a helper T cell? Explain how an antigen-presenting dendritic cell links innate pathogen capture to adaptive helper-T-cell activation through a specific peptide-MHC II complex.

Type `DENDRITIC_CELL_ANTIGEN_PRESENTATION_HELPER_T_CELL` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e74633664c21.js`; view `visualization-8fceefb63fa2.js` → `DendriticCellAntigenPresentationHelperTCellVisualization`.

#### Density-dependent population limiting factors

Type `POPULATION_ECOLOGY_DENSITY_DEPENDENT_LIMITING_FACTORS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-287064aeb533.js`; view `visualization-3be1bd76aadb.js` → `Visualization`.

#### Desmosomal cadherins and intermediate filaments resist tensile stress

A desmosome links two animal cells through cadherins and intermediate filaments; outward tension pulls both cells while their mechanical attachment remains intact.

Type `DESMOSOME_CELL_ANCHORING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5cc25cdcb23a.js`; view `visualization-ea8e6b8fc91d.js` → `Visualization`.

#### Diaphragm-driven inhalation and quiet exhalation

Animated quiet breathing: the diaphragm descends as lung volume rises and pressure falls, drawing air inward; it then rises as lung volume falls and pressure rises, driving air outward without completely emptying the lungs.

Type `ANIMAL_DIAPHRAGM_VENTILATION_MECHANICS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-424664833bf6.js`; view `visualization-16aa63aaa086.js` → `AnimalDiaphragmVentilationMechanicsVisualization`.

#### Diploblastic versus triploblastic organization

Type `ANIMAL_DIPLOBLASTIC_VERSUS_TRIPLOBLASTIC_ORGANIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-979021136373.js`; view `visualization-b24b3fbca7a7.js` → `AnimalDiploblasticVersusTriploblasticOrganizationVisualization`.

#### Diploid population allele-frequency bookkeeping

Type `POPULATION_GENETICS_ALLELE_FREQUENCY_BOOKKEEPING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f898c4eb601c.js`; view `visualization-abadf8e53ae2.js` → `Visualization`.

#### Direct animal-cell communication through aligned gap junctions

One small molecule moves continuously from one animal-cell cytoplasm through paired aligned gap-junction channels into the neighboring animal-cell cytoplasm.

Type `GAP_JUNCTION_CELL_COMMUNICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c64e52121975.js`; view `visualization-674f9660ef08.js` → `Visualization`.

#### Direct insect tracheal oxygen delivery

Animated insect respiration: one oxygen marker enters a spiracle, follows branching air-filled tracheae and a fine tracheole, and reaches a body cell directly without entering blood or hemolymph.

Type `ANIMAL_INSECT_TRACHEAL_GAS_DELIVERY` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-8bfdf3eae073.js`; view `visualization-7d4335e61815.js` → `AnimalInsectTrachealGasDeliveryVisualization`.

#### Direct membrane-stretch osmotic negative feedback

Type `OSMOTIC_NEGATIVE_FEEDBACK_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6c26ab36c0d3.js`; view `visualization-fd7d17751a8f.js` → `Visualization`.

#### Direct olfactory cortical pathway

Type `SENSORY_OLFACTORY_DIRECT_CORTICAL_PATHWAY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f189b0c0b4a3.js`; view `visualization-d162bdb56d49.js` → `Visualization`.

#### Direct plant-cell communication through a plasmodesma

One small molecule moves continuously through a membrane-lined plasmodesma and around its central desmotubule from one plant-cell cytoplasm into the neighboring plant-cell cytoplasm.

Type `PLASMODESMATA_CELL_COMMUNICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ca59a08b125b.js`; view `visualization-60be6bb59a23.js` → `Visualization`.

#### Direct versus indirect development

Direct versus indirect development: In direct development a young animal resembles a smaller version of the adult body plan; in indirect development an anatomically distinct larva transforms through metamorphosis before reaching its adult form.

Type `ANIMAL_DIRECT_VERSUS_INDIRECT_DEVELOPMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f72842582d7b.js`; view `visualization-201e701d37ff.js` → `AnimalDirectVersusIndirectDevelopmentVisualization`.

#### Direct-contact, local, and long-distance cell communication

Three cell-communication routes compare touching cells, a nearby local target, and a distant target reached through the bloodstream.

Type `CELL_COMMUNICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e353c31b65d6.js`; view `visualization-f16f9bbfb841.js` → `CellCommunicationVisualization`.

#### Directed isopod taxis toward a favorable moisture stimulus

Type `DIRECTED_TAXIS_STIMULUS_GRADIENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-555488305e41.js`; view `visualization-9b9ed2aa2a58.js` → `DirectedTaxisStimulusGradientVisualization`.

#### Discontinuous Okazaki-fragment synthesis

Type `DNA_REPLICATION_LAGGING_OKAZAKI_FRAGMENTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9e7df1ab4453.js`; view `visualization-7844d7000403.js` → `DnaReplicationLaggingOkazakiFragmentsVisualization`.

#### Diversity of life overview

Type `DIVERSITY_OF_LIFE_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d128dc8aaacf.js`; view `visualization-bc71f0663f4d.js` → `Visualization`.

#### DNA and RNA nucleotide comparison

DNA contains deoxyribose and thymine and usually has two strands, while RNA contains ribose and uracil and usually has one strand.

Type `DNA_RNA_NUCLEOTIDE_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d8a307b03004.js`; view `visualization-d8ea9db59f19.js` → `Visualization`.

#### DNA gene structure produces an aligned complementary RNA message

Type `DNA_AND_RNA_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4d8787b10dc9.js`; view `visualization-491f5634422d.js` → `DnaAndRnaStructureVisualization`.

#### DNA polymerase proofreading

Type `DNA_REPLICATION_POLYMERASE_PROOFREADING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-805e59ce7ab3.js`; view `visualization-a4e33f6bd92a.js` → `DnaReplicationPolymeraseProofreadingVisualization`.

#### DNA replication overview

Type `DNA_REPLICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-36cf057d68b8.js`; view `visualization-b2fe27ada31e.js` → `DnaReplicationVisualization`.

#### Dominant Golgi stack receives at cis and ships at trans

Type `GOLGI_APPARATUS_STRUCTURE_AND_SORTING` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-fac0216447fb.js`; view `visualization-ca96c102331f.js` → `Visualization`.

#### Doubling model-cell width lowers its surface-area-to-volume ratio

A one-unit model cell has surface area 6, volume 1, and a 6-to-1 ratio. A two-unit model cell has surface area 24, volume 8, and a 3-to-1 ratio. Increasing cell size lowers the surface-area-to-volume ratio and leaves less membrane exchange area per unit volume.

Type `CELL_THEORY_SURFACE_AREA_TO_VOLUME_RATIO` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d860ae5a868e.js`; view `visualization-fc64fc45172e.js` → `Visualization`.

#### Early-Earth prebiotic environments

Type `EARLY_EARTH_PREBIOTIC_ENVIRONMENTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-81058b95054b.js`; view `visualization-b9870ea21b9c.js` → `Visualization`.

#### Echinoderm larval-to-adult symmetry

Type `ANIMAL_ECHINODERM_LARVAL_TO_ADULT_SYMMETRY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b58fa045c9d8.js`; view `visualization-b7b530dcc50d.js` → `AnimalEchinodermLarvalToAdultSymmetryVisualization`.

#### Echinoderm water vascular tube feet

Type `ANIMAL_ECHINODERM_WATER_VASCULAR_TUBE_FEET` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e4912b15d968.js`; view `visualization-9bc68930d588.js` → `AnimalEchinodermWaterVascularTubeFeetVisualization`.

#### Ecological population density and habitat area

Type `POPULATION_ECOLOGY_DENSITY_AND_AREA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-abaf090ceac1.js`; view `visualization-56a74c87b3f6.js` → `Visualization`.

#### ecological-disturbance-secondary-succession

Type `ECOLOGICAL_DISTURBANCE_SECONDARY_SUCCESSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7c909b1a818f.js`; view `visualization-5658639c96c8.js` → `EcologicalDisturbanceSecondarySuccessionVisualization`.

#### Ecosystem energy flow versus matter cycling

Type `ECOSYSTEM_ENERGY_FLOW_VERSUS_MATTER_CYCLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e29ca0dd9ed3.js`; view `visualization-71e5fd4af82f.js` → `Visualization`.

#### Ecosystem food web energy pathways

Type `ECOSYSTEM_FOOD_WEB_ENERGY_PATHWAYS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-99ac228d759b.js`; view `visualization-54dbf7fcdabf.js` → `Visualization`.

#### Ecosystem primary productivity GPP and NPP

Type `ECOSYSTEM_PRIMARY_PRODUCTIVITY_GPP_NPP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b1aa2146fe45.js`; view `visualization-8327d03b9f69.js` → `Visualization`.

#### Ecosystem trophic energy pyramid

Type `ECOSYSTEM_TROPHIC_ENERGY_PYRAMID` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9660c42abf3b.js`; view `visualization-b32fa6817f70.js` → `Visualization`.

#### Ecosystem trophic level hierarchy

Type `ECOSYSTEM_TROPHIC_LEVEL_HIERARCHY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-28ad22688ec0.js`; view `visualization-a03b8ad1b510.js` → `Visualization`.

#### ecosystem-disturbance-food-web-cascade

Type `ECOSYSTEM_DISTURBANCE_FOOD_WEB_CASCADE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b07ef11f08ac.js`; view `visualization-66d852be0089.js` → `EcosystemDisturbanceFoodWebCascadeVisualization`.

#### Effective buffer range around pKa

Type `BIOLOGICAL_BUFFER_EFFECTIVE_PH_RANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cdcc03897190.js`; view `visualization-6a37283fc704.js` → `Visualization`.

#### Electron transport chain proton pumping

Type `ELECTRON_TRANSPORT_CHAIN_PROTON_PUMPING` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-2a071fe8df9a.js`; view `visualization-93df390edfae.js` → `ElectronTransportChainProtonPumpingVisualization`.

#### Embryo gibberellin activates aleurone enzymes and germination

Type `GIBBERELLIN_SEED_GERMINATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-bc1e84b8d572.js`; view `visualization-7667276b2825.js` → `Visualization`.

#### Embryonic cleavage and blastula formation

Embryonic cleavage and blastula formation: Early cleavage is a rapid series of mitotic divisions that increases cell number without enlarging the whole embryo; subsequent organization produces a blastula containing a fluid-filled blastocoel.

Type `ANIMAL_EMBRYONIC_CLEAVAGE_BLASTULA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-13d19f969c7a.js`; view `visualization-ab3dcbac24d0.js` → `AnimalEmbryonicCleavageBlastulaVisualization`.

#### Embryonic development stage sequence

Embryonic development stage sequence: After fertilization, the one-cell zygote undergoes cleavage to form a multicellular blastula. Gastrulation reorganizes cells into ectoderm, mesoderm, and endoderm, and later neurulation folds specialized ectoderm into a neural tube; these are ordered states of one developing embryo, not separate offspring.

Type `ANIMAL_EMBRYONIC_DEVELOPMENT_STAGE_SEQUENCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c840ad7d526d.js`; view `visualization-b3825ea7a482.js` → `AnimalEmbryonicDevelopmentStageSequenceVisualization`.

#### Endocytosis and vesicle uptake

Type `ENDOCYTOSIS_VESICLE_UPTAKE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-74ea7c8761d9.js`; view `visualization-384b8db70be1.js` → `Visualization`.

#### Endosymbiotic origin of chloroplasts

Type `LIFE_CHLOROPLAST_ENDOSYMBIOTIC_ORIGIN` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-94f29a3fe0fe.js`; view `visualization-bf88e6a424f7.js` → `Visualization`.

#### Endosymbiotic origin of mitochondria

Type `LIFE_ENDOSYMBIOTIC_ORIGIN_OF_MITOCHONDRIA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-245e5281b392.js`; view `visualization-63259be3042b.js` → `Visualization`.

#### Endothermy versus ectothermy

Type `VERTEBRATE_ENDOTHERMY_VERSUS_ECTOTHERMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cca550000786.js`; view `visualization-95313f585c27.js` → `Visualization`.

#### Environmental change shifts carrying capacity

Type `POPULATION_ECOLOGY_CARRYING_CAPACITY_ENVIRONMENTAL_CHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bca3f4b3ba3b.js`; view `visualization-50a7af22d06b.js` → `Visualization`.

#### Environmental selection pressure

Type `ENVIRONMENTAL_SELECTION_PRESSURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-372842ff9913.js`; view `visualization-553776e72700.js` → `EnvironmentalSelectionPressureVisualization`.

#### Enzyme activity rises to a temperature optimum before denaturation

Type `ENZYME_TEMPERATURE_ACTIVITY_CURVE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-48ac00d257e0.js`; view `visualization-64a096b159d0.js` → `Visualization`.

#### Enzyme structure, active site, substrate, and products

Type `ENZYME_STRUCTURE_AND_FUNCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-67b650603009.js`; view `visualization-d15d2be9a8ba.js` → `Visualization`.

#### Enzymes lower activation energy without changing reaction free energy

Type `ENZYME_ACTIVATION_ENERGY_PROFILE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-42aa1ee5e675.js`; view `visualization-39b41fb3037b.js` → `Visualization`.

#### Epidermal renewal and shedding

Type `EPIDERMAL_KERATINOCYTE_RENEWAL_AND_SHEDDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5ff6311826ce.js`; view `visualization-fca4070f3efa.js` → `EpidermalKeratinocyteRenewalAndSheddingVisualization`.

#### Epithelial apical-basal polarity

Type `EPITHELIAL_APICAL_BASAL_POLARITY_BASEMENT_MEMBRANE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f0e22c55295b.js`; view `visualization-7eba01d10ed3.js` → `EpithelialApicalBasalPolarityBasementMembraneVisualization`.

#### Epithelial cell migration closes a wound

Type `WOUND_REEPITHELIALIZATION_CELL_MIGRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bda3eb68be5b.js`; view `visualization-b96107a17cc5.js` → `WoundReepithelializationCellMigrationVisualization`.

#### Equal-time nutrient diffusion into small and large cells

Type `CELL_SIZE_DIFFUSION_PENETRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c9658a4fa072.js`; view `visualization-e9f2eb181e5c.js` → `CellSizeDiffusionPenetrationVisualization`.

#### Equal-volume compact and flattened cell surface comparison

Type `CELL_SIZE_SHAPE_EXCHANGE_SURFACE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-57068f32547f.js`; view `visualization-25f92e33c2d9.js` → `CellSizeShapeExchangeSurfaceVisualization`.

#### Ethylene fruit ripening feedback

Type `ETHYLENE_FRUIT_RIPENING_FEEDBACK` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dd55cfa4fea1.js`; view `visualization-a3655b4dc5a3.js` → `Visualization`.

#### Ethylene leaf abscission

Type `ETHYLENE_LEAF_ABSCISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-790391f33cd1.js`; view `visualization-e1e10f0d8e56.js` → `Visualization`.

#### Eukaryotic flagellum propulsion

Connect a traveling bend along one eukaryotic flagellum with propulsion of its attached cell in the opposite direction.

Type `EUKARYOTIC_FLAGELLUM_PROPULSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-018087453a82.js`; view `visualization-2f9ae8d64a33.js` → `Visualization`.

#### Eusocial colony division of labor

Type `ANIMAL_EUSOCIAL_COLONY_DIVISION_OF_LABOR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d6e90727b239.js`; view `visualization-8447ac9c4783.js` → `Visualization`.

#### eutrophication-decomposition-oxygen-depletion

Type `EUTROPHICATION_DECOMPOSITION_OXYGEN_DEPLETION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c97aefcc55e3.js`; view `visualization-b4ae044819cf.js` → `EutrophicationDecompositionOxygenDepletionVisualization`.

#### eutrophication-nutrient-runoff-algal-bloom

Type `EUTROPHICATION_NUTRIENT_RUNOFF_ALGAL_BLOOM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-371d3382c4cc.js`; view `visualization-7a01e7ee29ff.js` → `EutrophicationNutrientRunoffAlgalBloomVisualization`.

#### Evidence for evolution

Type `EVIDENCE_FOR_EVOLUTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e455190d0e52.js`; view `visualization-b43fc18dcddc.js` → `EvidenceForEvolutionVisualization`.

#### Evolutionary time, fossils, and major transitions

Type `EVOLUTIONARY_TIME_FOSSILS_AND_MAJOR_TRANSITIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c64579b37e0d.js`; view `visualization-76c59e8b5c73.js` → `EvolutionaryTimeFossilsAndMajorTransitionsVisualization`.

#### Excitation-contraction coupling

Type `MUSCULOSKELETAL_EXCITATION_CONTRACTION_COUPLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6b48b6e720d9.js`; view `visualization-8a832227257e.js` → `MusculoskeletalExcitationContractionCouplingVisualization`.

#### Excitatory versus inhibitory synapses

An excitatory synapse allows sodium entry and produces a positive graded EPSP toward threshold. An inhibitory synapse allows chloride entry and produces an inhibitory IPSP that opposes firing.

Type `EXCITATORY_VERSUS_INHIBITORY_SYNAPSES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-74fcb7e43d98.js`; view `visualization-3616f6079f3e.js` → `ExcitatoryVersusInhibitorySynapsesVisualization`.

#### Exocytosis and vesicle secretion

Type `EXOCYTOSIS_VESICLE_SECRETION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-883dc4ee9e3f.js`; view `visualization-1b03c240946e.js` → `Visualization`.

#### Exponential population growth with abundant resources

Type `POPULATION_ECOLOGY_EXPONENTIAL_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ffd542c2ce07.js`; view `visualization-dd04b60f6b47.js` → `Visualization`.

#### Exponential versus logistic population-growth models

Type `POPULATION_ECOLOGY_EXPONENTIAL_VERSUS_LOGISTIC_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9a8bbb060c43.js`; view `visualization-27c7899670ab.js` → `Visualization`.

#### Exposed gymnosperm seeds versus enclosed angiosperm seeds

Compare gymnosperm seeds exposed on cone scales with angiosperm seeds enclosed inside an ovary-derived fruit while recognizing that both groups produce seeds.

Type `PLANT_GYMNOSPERM_VERSUS_ANGIOSPERM_SEED_ENCLOSURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-594d18be1033.js`; view `visualization-41fce2258758.js` → `PlantGymnospermVersusAngiospermSeedEnclosureVisualization`.

#### Facilitated diffusion through a carrier

Type `FACILITATED_DIFFUSION_CARRIER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-51ad246c8d12.js`; view `visualization-642a761b2f62.js` → `Visualization`.

#### Facilitated diffusion through a channel

Type `FACILITATED_DIFFUSION_CHANNEL` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5a9db9c8f033.js`; view `visualization-648b7d950ade.js` → `Visualization`.

#### Female reproductive anatomy

Female reproductive anatomy: The ovaries release oocytes, uterine tubes receive them and are the usual site of fertilization, the uterus contains the lining where implantation occurs, and the cervix forms the lower uterine outlet.

Type `ANIMAL_FEMALE_REPRODUCTIVE_ANATOMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3e918a857c6f.js`; view `visualization-18409cb99477.js` → `AnimalFemaleReproductiveAnatomyVisualization`.

#### Fermentation NAD regeneration

Type `FERMENTATION_NAD_REGENERATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-bf0deb61b361.js`; view `visualization-c38597aa64d1.js` → `FermentationNadRegenerationVisualization`.

#### Fern sori, sporangia, and spores

Locate sori on a fern sporophyte frond and identify the sporangia within each sorus as structures that produce haploid spores by meiosis.

Type `FERN_SORI_SPORANGIA_AND_SPORE_PRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-92b3231a4a1e.js`; view `visualization-e94e0b8830f0.js` → `FernSoriSporangiaAndSporeProductionVisualization`.

#### Fern sporophyte and gametophyte life cycle

Trace a dominant diploid fern sporophyte through meiosis, a haploid spore, an independent heart-shaped gametophyte, water-dependent gamete fusion, and a diploid zygote that becomes a new sporophyte.

Type `FERN_SPOROPHYTE_GAMETOPHYTE_LIFE_CYCLE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-4357ee6b3888.js`; view `visualization-ad355478a0c1.js` → `FernSporophyteGametophyteLifeCycleVisualization`.

#### Fertilization and the block to polyspermy

Fertilization and the block to polyspermy: When one sperm fuses with a mammalian oocyte, egg activation triggers cortical-granule release and biochemical modification of the surrounding zona pellucida. The modified egg coat reduces binding or penetration by additional sperm, preventing polyspermy and preserving one maternal and one paternal genetic contribution.

Type `ANIMAL_FERTILIZATION_CORTICAL_BLOCK_POLYSPERMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1f935d4bac27.js`; view `visualization-973f66f4792c.js` → `AnimalFertilizationCorticalBlockPolyspermyVisualization`.

#### Fish operculum and gill ventilation

Type `VERTEBRATE_FISH_OPERCULUM_GILL_VENTILATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a73142cd456e.js`; view `visualization-31bfeec6e071.js` → `Visualization`.

#### Fish-gill countercurrent oxygen exchange

Animated fish-gill countercurrent exchange: water and capillary blood flow in opposite directions on separate sides of a lamella, oxygen crosses repeatedly from water into blood, and the same blood becomes more oxygen-rich.

Type `ANIMAL_GILL_COUNTERCURRENT_OXYGEN_EXCHANGE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-2936b53c6479.js`; view `visualization-ec0c01b8f3de.js` → `AnimalGillCountercurrentOxygenExchangeVisualization`.

#### Five major mass extinctions in geologic time

Type `FIVE_MAJOR_MASS_EXTINCTIONS_IN_GEOLOGIC_TIME` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5f246c089eb7.js`; view `visualization-b2cc150f577b.js` → `FiveMajorMassExtinctionsInGeologicTimeVisualization`.

#### Five-prime-to-three-prime DNA synthesis

Type `DNA_REPLICATION_FIVE_PRIME_TO_THREE_PRIME_SYNTHESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-68d8f07ee799.js`; view `visualization-42c03da8d18a.js` → `DnaReplicationFivePrimeToThreePrimeSynthesisVisualization`.

#### Flatworm branched gastrovascular distribution

Type `ANIMAL_FLATWORM_BRANCHED_GASTROVASCULAR_DISTRIBUTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cf5096137673.js`; view `visualization-b7e08f8ca7e0.js` → `AnimalFlatwormBranchedGastrovascularDistributionVisualization`.

#### Florigen leaf to shoot apex

Type `FLORIGEN_LEAF_TO_SHOOT_APEX` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cfb2e291bbf8.js`; view `visualization-61a9ed2afce3.js` → `Visualization`.

#### Flower reproductive anatomy

Flower anatomy showing pollen-producing anthers, receptive stigma, connecting style, ovary, and ovules inside the ovary

Type `PLANT_FLOWER_REPRODUCTIVE_ANATOMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-70e9046b2d2f.js`; view `visualization-b0aa7c75edef.js` → `Visualization`.

#### Flower-to-fruit and ovule-to-seed development

A flower's ovary developing into a fruit while the same enclosed fertilized ovules become seeds inside it

Type `PLANT_FLOWER_TO_FRUIT_SEED_DEVELOPMENT` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-dcf56e501255.js`; view `visualization-9c7d7ee66f54.js` → `Visualization`.

#### Flowering plant structure, transport, and reproduction

Flowering plant showing roots below soil, a stem, leaves, a flower, upward xylem water transport, and source-to-sink phloem sugar transport

Type `PLANT_STRUCTURE_TRANSPORT_AND_REPRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-73c45877b1bc.js`; view `visualization-2109586ee250.js` → `Visualization`.

#### Flowering-plant life cycle

Flowering-plant life cycle: a seed grows into a seedling and then a flowering adult, which produces new seeds for another generation.

Type `ORGANISM_FLOWERING_PLANT_LIFE_CYCLE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-324c515c6607.js`; view `visualization-9716725cda18.js` → `OrganismFloweringPlantLifeCycleVisualization`.

#### Flowering-plant life cycle

Closed flowering-plant life cycle showing a living seed, rooted seedling, mature flowering plant, bee-assisted pollination, new seeds in fruit, and dispersal back to another generation

Type `PLANT_FLOWERING_LIFE_CYCLE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-416a5b513130.js`; view `visualization-2069822fdfe7.js` → `Visualization`.

#### Focus and microscope depth of field

Type `MICROSCOPY_FOCUS_DEPTH_OF_FIELD` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d4306cc9f2f8.js`; view `visualization-9a65f4b97c76.js` → `Visualization`.

#### Folded mitochondrial inner membranes localize many ATP-forming complexes

Type `ORGANELLE_MEMBRANE_SURFACE_AREA` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-453b4ad324ee.js`; view `visualization-11c98a30d51b.js` → `Visualization`.

#### Food separates into nutrients that become growing body tissue

Food enters the intestine, separates into smaller nutrients, and the same food-derived matter becomes growing body tissue.

Type `FOOD_DIGESTION_TO_BUILDING_MATERIALS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cb82ca8447e5.js`; view `visualization-9b1069885dfd.js` → `Visualization`.

#### Fossil strata and relative age

Type `EVOLUTION_FOSSIL_STRATA_RELATIVE_AGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9f05b607c84d.js`; view `visualization-ce317d4e4132.js` → `EvolutionFossilStrataRelativeAgeVisualization`.

#### Fossil-age bracketing with volcanic ash

Type `FOSSIL_AGE_BRACKETING_WITH_VOLCANIC_ASH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-70f88dbb98e8.js`; view `visualization-84624b662397.js` → `FossilAgeBracketingWithVolcanicAshVisualization`.

#### Fossil-record preservation and sampling bias

Type `FOSSIL_RECORD_PRESERVATION_AND_SAMPLING_BIAS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7956eb431ee9.js`; view `visualization-b9e982486a0c.js` → `FossilRecordPreservationAndSamplingBiasVisualization`.

#### Fossilization through burial, mineralization, and exposure

Type `FOSSILIZATION_BURIAL_MINERALIZATION_EXPOSURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-16af45aaa5a5.js`; view `visualization-12bff3715995.js` → `FossilizationBurialMineralizationExposureVisualization`.

#### Founder effect and a newly established population

Type `POPULATION_GENETICS_FOUNDER_EFFECT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b44205a60514.js`; view `visualization-ebf626fd1887.js` → `Visualization`.

#### Four abnormal meiosis-I gametes contrast with two abnormal and two normal meiosis-II gametes

Type `MEIOTIC_NONDISJUNCTION_OUTCOME_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-730967eec15c.js`; view `visualization-c041d92d2e56.js` → `Visualization`.

#### Four animal tissue types

Type `ANIMAL_FOUR_TISSUE_TYPES_STRUCTURE_AND_FUNCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4bad07577538.js`; view `visualization-8011fe3931f1.js` → `AnimalFourTissueTypesStructureAndFunctionVisualization`.

#### Four cells crossing a calibrated 320-micrometer microscope field

A compound light microscope reveals four similar cells spanning a 320-micrometer field diameter, so each cell is about 80 micrometers wide.

Type `CELL_THEORY_MICROSCOPE_FIELD_OF_VIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5c33e30ce081.js`; view `visualization-2baf05aa9934.js` → `Visualization`.

#### Four Pp by Pp transmission paths become 1:2:1 genotypes and 3:1 phenotypes

Type `MENDELIAN_MONOHYBRID_PHENOTYPE_RATIOS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-be85edf3a8cf.js`; view `visualization-ee27f9893864.js` → `Visualization`.

#### Four stages of skin wound repair

Type `SKIN_WOUND_HEMOSTASIS_SCAB_AND_TISSUE_REPAIR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9b2ef94680d5.js`; view `visualization-c2aba9c25340.js` → `SkinWoundHemostasisScabAndTissueRepairVisualization`.

#### Fracture healing and callus formation

Type `MUSCULOSKELETAL_FRACTURE_HEALING_STAGES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c637cb0eec12.js`; view `visualization-67d31467f0e0.js` → `MusculoskeletalFractureHealingStagesVisualization`.

#### Frameshift versus in-frame insertion

Type `MUTATION_FRAMESHIFT_VERSUS_IN_FRAME` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4bb2814e92f7.js`; view `visualization-9663ef221640.js` → `Visualization`.

#### Free bacterial cells attach and develop a protective biofilm matrix

Type `BACTERIAL_BIOFILM_FORMATION_AND_MATRIX` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-456585d3a920.js`; view `visualization-1b1d412bf567.js` → `BacterialBiofilmFormationAndMatrixVisualization`.

#### Freshwater fish osmoregulation

Type `FRESHWATER_FISH_OSMOREGULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-89e0028a0ec7.js`; view `visualization-e554a118678a.js` → `FreshwaterFishOsmoregulationVisualization`.

#### Freshwater protist contractile-vacuole osmoregulation

Type `CONTRACTILE_VACUOLE_OSMOREGULATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-49d4dc985996.js`; view `visualization-703aa6f17e3e.js` → `Visualization`.

#### Freshwater versus marine fish osmoregulation

Type `FRESHWATER_VERSUS_MARINE_FISH_OSMOREGULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b63773132957.js`; view `visualization-95f1c36bcfa8.js` → `FreshwaterVersusMarineFishOsmoregulationVisualization`.

#### Frog metamorphosis

Frog metamorphosis: an egg becomes a tadpole, then a legged froglet with a shortening tail, then an adult frog that produces new eggs.

Type `ORGANISM_FROG_METAMORPHOSIS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-f323766213be.js`; view `visualization-98afb1a98c85.js` → `OrganismFrogMetamorphosisVisualization`.

#### Functional redundancy preserves a represented pollination role

Type `BIODIVERSITY_FUNCTIONAL_REDUNDANCY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cccc281bbee7.js`; view `visualization-51cacafeacb1.js` → `Visualization`.

#### Functional-group polarity and water interactions

Type `BIOLOGICAL_FUNCTIONAL_GROUP_POLARITY_AND_WATER_INTERACTIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-728bb0a4c34b.js`; view `visualization-750aa2c81b23.js` → `Visualization`.

#### Fungal decomposition and matter cycling

Type `LIFE_FUNGAL_DECOMPOSITION_AND_MATTER_CYCLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b3a0c8b50778.js`; view `visualization-5be214cc172b.js` → `Visualization`.

#### Fungal extracellular digestion

Type `FUNGAL_EXTRACELLULAR_DIGESTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2a19f75221d6.js`; view `visualization-7a34f0199661.js` → `Visualization`.

#### Fungal hyphae and mycelium

Type `FUNGAL_HYPHAE_AND_MYCELIUM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bc847d169533.js`; view `visualization-e0e27d96450f.js` → `Visualization`.

#### Fungal septate and coenocytic hyphae

Type `FUNGAL_SEPTATE_AND_COENOCYTIC_HYPHAE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7771be7086de.js`; view `visualization-9b35fed8a47d.js` → `Visualization`.

#### Fungal spore dispersal and germination

Type `FUNGAL_SPORE_DISPERSAL_AND_GERMINATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-540bf415710b.js`; view `visualization-ae0c2665b869.js` → `Visualization`.

#### G1/S, G2/M, and spindle checkpoint prerequisites

Type `CELL_CYCLE_CHECKPOINT_DECISION_MAP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-38c7b029795b.js`; view `visualization-c39c3fcc60c0.js` → `Visualization`.

#### Gametophyte versus sporophyte dominance

Compare the conspicuous haploid moss gametophyte with the dominant diploid sporophytes of ferns, conifers, and flowering plants while retaining both generations in every lineage.

Type `PLANT_GAMETOPHYTE_SPOROPHYTE_DOMINANCE_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2b6de71a891e.js`; view `visualization-988e3e7f618a.js` → `PlantGametophyteSporophyteDominanceComparisonVisualization`.

#### Gastrulation and three germ layers

Gastrulation and three germ layers: During gastrulation cells of an early embryo move inward and reorganize to establish the outer ectoderm, middle mesoderm, and inner endoderm, creating the layered foundation for later tissues and organs.

Type `ANIMAL_GASTRULATION_GERM_LAYER_FORMATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cbb13a39903e.js`; view `visualization-42b36f303605.js` → `AnimalGastrulationGermLayerFormationVisualization`.

#### Gel electrophoresis apparatus

A recognizable top-down electrophoresis chamber frames an agarose gel with aligned wells at the negative end, a size-standard ladder, a sample lane, and the positive electrode beyond the migration path.

Type `GEL_ELECTROPHORESIS_APPARATUS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-19d92ba3f9ff.js`; view `visualization-4b661bcffb5e.js` → `Visualization`.

#### Gel electrophoresis size separation

DNA fragments labeled 900, 500, and 200 base pairs start at the same negative-electrode wells; the 200-base-pair fragment travels farthest toward the positive electrode while the 900-base-pair fragment travels least.

Type `GEL_ELECTROPHORESIS_SIZE_SEPARATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-7d3d7e57affb.js`; view `visualization-a5318bb9adda.js` → `Visualization`.

#### Gene flow between existing populations

Type `POPULATION_GENETICS_GENE_FLOW_MIGRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7bfc4ad9b598.js`; view `visualization-aab996db0d74.js` → `Visualization`.

#### Gibberellin stem internode elongation

Type `GIBBERELLIN_STEM_INTERNODE_ELONGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-56d6af94495e.js`; view `visualization-e194060410ea.js` → `Visualization`.

#### Glycolysis carbon and energy flow

Type `GLYCOLYSIS_CARBON_AND_ENERGY_FLOW` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-2042578c6082.js`; view `visualization-60c72ef7c5e9.js` → `GlycolysisCarbonAndEnergyFlowVisualization`.

#### Glycosidic bond formation and hydrolysis

Type `GLYCOSIDIC_BOND_FORMATION_HYDROLYSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6985a3ff1284.js`; view `visualization-e891c71bb2bb.js` → `Visualization`.

#### Gradual versus punctuated fossil change

Type `GRADUAL_VERSUS_PUNCTUATED_FOSSIL_CHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-592424351345.js`; view `visualization-c6e6223096c1.js` → `GradualVersusPunctuatedFossilChangeVisualization`.

#### Gram-positive versus Gram-negative envelopes

Type `GRAM_POSITIVE_VERSUS_GRAM_NEGATIVE_ENVELOPES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-69751cc87d2a.js`; view `visualization-8d7503e1f80b.js` → `GramPositiveVersusGramNegativeEnvelopesVisualization`.

#### Great Oxygenation and the rise of atmospheric oxygen

Type `GREAT_OXYGENATION_AND_ATMOSPHERIC_OXYGEN_RISE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-253c0912488c.js`; view `visualization-78e09c014ee6.js` → `GreatOxygenationAndAtmosphericOxygenRiseVisualization`.

#### Guard-cell turgor and stomatal opening

Two guard cells take up water, bow apart as their turgor rises, and reveal an open stomatal pore between the same cells

Type `PLANT_GUARD_CELL_TURGOR_STOMATAL_OPENING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4e450da83722.js`; view `visualization-f4da7bb98d44.js` → `Visualization`.

#### Gymnosperm cones, pollen, and exposed seeds

Trace an initially unfertilized ovule on a recognizable conifer cone through pollen arrival and fertilization to visible seeds exposed on the same cone scales.

Type `GYMNOSPERM_CONE_POLLINATION_AND_EXPOSED_SEEDS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-ce71b0df47d1.js`; view `visualization-8f88e697547f.js` → `GymnospermConePollinationAndExposedSeedsVisualization`.

#### habitat-fragmentation-population-isolation

Type `HABITAT_FRAGMENTATION_POPULATION_ISOLATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5a5c7e69e977.js`; view `visualization-4c7b24bc909f.js` → `HabitatFragmentationPopulationIsolationVisualization`.

#### Hardy–Weinberg expected genotype frequencies

Type `POPULATION_GENETICS_HARDY_WEINBERG_EQUILIBRIUM_EXPECTATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5150123cf932.js`; view `visualization-5b9275bd900e.js` → `Visualization`.

#### Helper T-cell coordination

How can helper T cells coordinate B-cell and cytotoxic-T-cell responses? Explain that activated helper T cells coordinate both antibody-producing B-cell responses and cell-mediated cytotoxic T-cell responses through targeted signaling.

Type `HELPER_T_CELL_COORDINATES_ADAPTIVE_IMMUNITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-93747a3369c7.js`; view `visualization-956d30bb9787.js` → `HelperTCellCoordinatesAdaptiveImmunityVisualization`.

#### Hemoglobin loads oxygen at lungs and unloads it at tissues

Hemoglobin oxygen-transport animation: oxygen moves from lung air onto one red blood cell, that same cell remains inside the blood vessel while traveling to body tissue, and the oxygen leaves the cell for the tissue.

Type `ANIMAL_HEMOGLOBIN_OXYGEN_LOADING_UNLOADING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5e4bde0a90b5.js`; view `visualization-7407f0dad555.js` → `AnimalHemoglobinOxygenLoadingUnloadingVisualization`.

#### Heritable trait variation in a population

Type `HERITABLE_TRAIT_VARIATION_POPULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a615e14ccc37.js`; view `visualization-691a8109819c.js` → `HeritableTraitVariationPopulationVisualization`.

#### Hinge versus ball-and-socket motion

Type `MUSCULOSKELETAL_HINGE_VERSUS_BALL_AND_SOCKET` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-762e2335d307.js`; view `visualization-ccde04bf9b4a.js` → `MusculoskeletalHingeVersusBallAndSocketVisualization`.

#### Histone acetylation is associated with more open chromatin, increased promoter accessibility, RNA-polymerase recruitment, and visible mRNA production.

Type `HISTONE_ACETYLATION_CHROMATIN_OPENING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-167d63e1a2f5.js`; view `visualization-20d0437eebaf.js` → `Visualization`.

#### Homologous vertebrate forelimbs

Type `EVOLUTION_HOMOLOGOUS_VERTEBRATE_FORELIMBS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e38b20b2bf6b.js`; view `visualization-279a6c20acd1.js` → `EvolutionHomologousVertebrateForelimbsVisualization`.

#### HPA axis cortisol stress response

Type `HPA_AXIS_CORTISOL_STRESS_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2f43bdec8785.js`; view `visualization-40d300027ea6.js` → `Visualization`.

#### HPT axis thyroid hormone regulation

Type `HPT_AXIS_THYROID_HORMONE_REGULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7df912491cdc.js`; view `visualization-5832d2227640.js` → `Visualization`.

#### human-land-use-biodiversity-loss

Type `HUMAN_LAND_USE_BIODIVERSITY_LOSS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3c23925a2cff.js`; view `visualization-85de47983bcf.js` → `HumanLandUseBiodiversityLossVisualization`.

#### Humoral versus cell-mediated immunity

How do antibody-mediated and T-cell-mediated defenses target different infections? Distinguish humoral defense against extracellular targets from cell-mediated CD8 T-cell defense against infected host cells while recognizing both as adaptive immunity.

Type `HUMORAL_VERSUS_CELL_MEDIATED_IMMUNITY` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-11a1a8a393bb.js`; view `visualization-ba60ace6d616.js` → `HumoralVersusCellMediatedImmunityVisualization`.

#### Hydrostatic skeleton, exoskeleton, and endoskeleton

Type `ANIMAL_HYDROSTATIC_EXOSKELETON_ENDOSKELETON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f77a214b3acf.js`; view `visualization-fbb077df1e9d.js` → `AnimalHydrostaticExoskeletonEndoskeletonVisualization`.

#### Immersion oil retains light lost at a glass-to-air interface

Type `MICROSCOPY_OIL_IMMERSION_REFRACTIVE_INDEX` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-780edb36cbd7.js`; view `visualization-50e7537507bb.js` → `Visualization`.

#### In-frame insertion and deletion

Type `MUTATION_IN_FRAME_INDELS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-aaecd71e70d3.js`; view `visualization-c494f2f527d4.js` → `Visualization`.

#### Incomplete DNA replication blocks G2 until a complete chromosome can enter mitosis

Type `G2_REPLICATION_COMPLETION_CHECKPOINT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-558a29617ab5.js`; view `visualization-88320ba29086.js` → `Visualization`.

#### Incomplete dominance heterozygote cross and one-to-two-to-one ratio

Type `INCOMPLETE_DOMINANCE_PHENOTYPE_RATIOS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-822c8d210de0.js`; view `visualization-1d6a16e0ad59.js` → `IncompleteDominancePhenotypeRatiosVisualization`.

#### Incomplete versus complete digestive tract

Type `ANIMAL_INCOMPLETE_VERSUS_COMPLETE_DIGESTIVE_TRACT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-23c40861ef25.js`; view `visualization-3c1e79c031db.js` → `AnimalIncompleteVersusCompleteDigestiveTractVisualization`.

#### Independent chromosome-set and DNA-content accounting through S phase and both meiotic divisions

Type `MEIOTIC_CHROMOSOME_CHROMATID_ACCOUNTING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d0a4b5e77aed.js`; view `visualization-8967ae21110a.js` → `Visualization`.

#### Index-fossil correlation across rock layers

Type `INDEX_FOSSIL_CORRELATION_ACROSS_ROCK_LAYERS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ea30f50b04d8.js`; view `visualization-4789704d4e97.js` → `IndexFossilCorrelationAcrossRockLayersVisualization`.

#### Induced-fit binding, catalysis, product release, and enzyme reuse

Type `ENZYME_INDUCED_FIT_CATALYTIC_CYCLE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d09e20b6ac28.js`; view `visualization-bc75d7583231.js` → `Visualization`.

#### Inherited diversity within one species

Type `BIODIVERSITY_GENETIC_DIVERSITY_WITHIN_SPECIES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7ead817c9a68.js`; view `visualization-96c8c6c7ffd7.js` → `Visualization`.

#### Innate versus adaptive immune response timing

How do innate and adaptive responses differ across a first and repeated infection? Distinguish the rapid broad innate response from slower antigen-specific primary adaptive activation and the faster secondary adaptive response produced by matching immune memory.

Type `INNATE_VERSUS_ADAPTIVE_IMMUNE_RESPONSE_TIMING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-53728c5f3da2.js`; view `visualization-c34ee7141e76.js` → `InnateVersusAdaptiveImmuneResponseTimingVisualization`.

#### Integrin mechanically attaches extracellular matrix to actin

Extracellular fibronectin binds an integrin spanning an animal-cell membrane, completing a physical connection from collagen in the extracellular matrix to actin inside the cell.

Type `INTEGRIN_CELL_MATRIX_ADHESION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-186cbe0b107d.js`; view `visualization-744afbbdc2b0.js` → `Visualization`.

#### Interferon antiviral signaling between cells

How does an infected cell warn nearby cells with antiviral interferon? Explain how antiviral interferon released by an infected cell induces protective gene expression in neighboring cells instead of directly destroying extracellular viruses.

Type `INTERFERON_ANTIVIRAL_SIGNALING_BETWEEN_CELLS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-afc926098422.js`; view `visualization-161397094cfd.js` → `InterferonAntiviralSignalingBetweenCellsVisualization`.

#### Internal versus external fertilization

Internal versus external fertilization: In internal fertilization gametes join inside the reproductive tract; in external fertilization parents release gametes into an external environment, commonly water, where fertilization occurs.

Type `ANIMAL_INTERNAL_VERSUS_EXTERNAL_FERTILIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c7ac3f150e46.js`; view `visualization-c75578aba2de.js` → `AnimalInternalVersusExternalFertilizationVisualization`.

#### Interphase growth, DNA replication, and preparation

Type `INTERPHASE_GROWTH_AND_DNA_REPLICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ce51cb96bd01.js`; view `visualization-f12409b77adb.js` → `Visualization`.

#### Intestinal nutrient delivery through the hepatic portal vein

Animated hepatic portal circulation: one water-soluble nutrient crosses from the intestine into a blood capillary, follows the hepatic portal vein to the liver, and only then continues toward the heart.

Type `ANIMAL_HEPATIC_PORTAL_NUTRIENT_ROUTING` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-dd795f50e100.js`; view `visualization-907bf792f176.js` → `AnimalHepaticPortalNutrientRoutingVisualization`.

#### invasive-species-competitive-displacement

Type `INVASIVE_SPECIES_COMPETITIVE_DISPLACEMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e80de06881ec.js`; view `visualization-c303b5ab110b.js` → `InvasiveSpeciesCompetitiveDisplacementVisualization`.

#### Inverted microscope image and opposite stage movement

Type `MICROSCOPY_INVERTED_IMAGE_STAGE_MOVEMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2403f89fd437.js`; view `visualization-f144efb8ef79.js` → `Visualization`.

#### IP3 opens an ER channel and previously stored calcium ions activate a response

Calcium second-messenger animation: receptor signaling produces intracellular IP3, IP3 opens an endoplasmic-reticulum channel, previously stored calcium ions enter the cytoplasm, and a calcium-sensitive response activates.

Type `CALCIUM_SECOND_MESSENGER_RELAY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ffe400528963.js`; view `visualization-ed3397e5fe35.js` → `Visualization`.

#### Island colonization and evolutionary biogeography

Type `EVOLUTION_BIOGEOGRAPHY_ISLAND_COLONIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3ddd1b7f2f89.js`; view `visualization-b4412a3de568.js` → `EvolutionBiogeographyIslandColonizationVisualization`.

#### Jawless versus jawed fish

Type `VERTEBRATE_JAWLESS_VERSUS_JAWED_FISH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-eeca5948c7c2.js`; view `visualization-65a82e0b308a.js` → `Visualization`.

#### Kinesin and dynein vesicle transport

Compare plus-end-directed kinesin transport with minus-end-directed dynein transport on the same polarized microtubule.

Type `KINESIN_DYNEIN_VESICLE_TRANSPORT` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-432c209e1ce6.js`; view `visualization-a910f6bc5ddc.js` → `Visualization`.

#### Lateral fluidity of the plasma membrane

Type `PLASMA_MEMBRANE_LATERAL_FLUIDITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-23e85f38633a.js`; view `visualization-35a6bec111c2.js` → `Visualization`.

#### Leading-versus-lagging synthesis comparison

Type `DNA_REPLICATION_LEADING_LAGGING_STRAND_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a47564d8ff56.js`; view `visualization-a973cbea7beb.js` → `DnaReplicationLeadingLaggingStrandComparisonVisualization`.

#### Leaf tissue and stomatal anatomy

Leaf cross section identifying protective epidermis, palisade and spongy mesophyll, a vein with xylem and phloem, and a stomatal pore between guard cells

Type `PLANT_LEAF_TISSUE_AND_STOMATA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-519b5b544178.js`; view `visualization-ff11d4187844.js` → `Visualization`.

#### Lichen fungal-algal symbiosis

Type `LICHEN_FUNGAL_ALGAL_SYMBIOSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ce2c8996ae63.js`; view `visualization-b8611eb70bea.js` → `Visualization`.

#### Life-history tradeoffs in offspring number and care

Type `POPULATION_ECOLOGY_LIFE_HISTORY_TRADEOFFS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f195fc53fca2.js`; view `visualization-c92c15113d50.js` → `Visualization`.

#### Ligand dissociation and phosphatase-mediated phosphate removal terminate a cellular response

Signaling-termination animation: an active signal and cellular response begin together, the bound extracellular ligand dissociates, a phosphatase removes the kinase's existing phosphate, and the dependent response turns off.

Type `SIGNALING_PATHWAY_TERMINATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-056b02527aad.js`; view `visualization-ffe5308f8055.js` → `Visualization`.

#### Linked chromosome loci favor parental over recombinant allele combinations

Type `LINKED_GENE_INHERITANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9127482d87d3.js`; view `visualization-2b2042509291.js` → `LinkedGeneInheritanceVisualization`.

#### Lipid classes overview

Type `LIPID_CLASSES_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4d388e531655.js`; view `visualization-9fcee9be7107.js` → `LipidClassesOverviewVisualization`.

#### Lipid hydrophobicity in water

Type `LIPID_HYDROPHOBICITY_IN_WATER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a315e1c4a7f6.js`; view `visualization-ebaaec1d4024.js` → `LipidHydrophobicityInWaterVisualization`.

#### Lipid tail saturation and packing

Type `LIPID_TAIL_SATURATION_PACKING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-772703df0b68.js`; view `visualization-8e0e1c081ddb.js` → `LipidTailSaturationPackingVisualization`.

#### Living seed: protective coat, stored food, and embryo

Inside a living seed: a protective seed coat surrounds stored food and a living plant embryo with an attached embryonic root.

Type `ORGANISM_SEED_STRUCTURE_AND_STORED_FOOD` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c8498b391a03.js`; view `visualization-34cd46d3a262.js` → `OrganismSeedStructureAndStoredFoodVisualization`.

#### Lobe-fin to tetrapod limb homology

Type `VERTEBRATE_LOBE_FIN_TO_TETRAPOD_LIMB_HOMOLOGY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-edb0bb920300.js`; view `visualization-465e2446b811.js` → `Visualization`.

#### Logistic population growth and carrying capacity

Type `POPULATION_ECOLOGY_LOGISTIC_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-da06ed90723c.js`; view `visualization-488f7590fce8.js` → `Visualization`.

#### Long-bone growth at the growth plate

Type `MUSCULOSKELETAL_LONG_BONE_GROWTH_PLATE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-43845f929544.js`; view `visualization-53c5be02084c.js` → `MusculoskeletalLongBoneGrowthPlateVisualization`.

#### Long-bone structure and function

Type `MUSCULOSKELETAL_LONG_BONE_COMPACT_SPONGY_MARROW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5f5e13b6ab5b.js`; view `visualization-ce92f0be426b.js` → `MusculoskeletalLongBoneCompactSpongyMarrowVisualization`.

#### Loop of Henle countercurrent concentration

Type `LOOP_OF_HENLE_COUNTERCURRENT_CONCENTRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bb7e74c71801.js`; view `visualization-84e69ca0dfe7.js` → `LoopOfHenleCountercurrentConcentrationVisualization`.

#### Lophotrochozoan versus ecdysozoan lineages

Type `ANIMAL_LOPHOTROCHOZOAN_VERSUS_ECDYSOZOAN_LINEAGES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1a0aea7b3410.js`; view `visualization-683786782e9d.js` → `AnimalLophotrochozoanVersusEcdysozoanLineagesVisualization`.

#### Lymphocyte development and recirculation

How do B and T lymphocytes mature and recirculate to survey secondary lymphoid organs? Distinguish B-cell maturation in bone marrow from T-cell maturation in the thymus and trace both mature lymphocyte populations through blood and lymph to secondary lymphoid surveillance sites.

Type `LYMPHOCYTE_DEVELOPMENT_RECIRCULATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-b6d38700d2b7.js`; view `visualization-defbda060803.js` → `LymphocyteDevelopmentRecirculationVisualization`.

#### Magnification versus resolving power

Type `MICROSCOPY_MAGNIFICATION_VERSUS_RESOLVING_POWER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-14ad585f6688.js`; view `visualization-87dd3d13f3ff.js` → `Visualization`.

#### Major animal phyla and representative body plans

Type `ANIMAL_MAJOR_PHYLA_AND_BODY_PLAN_TRAITS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-61ce21314989.js`; view `visualization-3bafb158fda3.js` → `AnimalMajorPhylaAndBodyPlanTraitsVisualization`.

#### Male reproductive anatomy and sperm route

Male reproductive anatomy and sperm route: Sperm form in the testes, mature in the epididymis, travel through the vas deferens, join secretions from accessory glands near the prostate, and leave through the urethra; the urinary bladder is a nearby landmark, not the source of sperm.

Type `ANIMAL_MALE_REPRODUCTIVE_ANATOMY_SPERM_ROUTE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-52d53df3c9e7.js`; view `visualization-7327ee589602.js` → `AnimalMaleReproductiveAnatomySpermRouteVisualization`.

#### Mammalian airway, lungs, and alveolar exchange anatomy

Mammalian respiratory anatomy: one trachea branches into both recognizable lungs and connects to enlarged alveoli, where oxygen crosses from air into pulmonary blood and carbon dioxide crosses back into alveolar air.

Type `ANIMAL_RESPIRATORY_AIRWAY_AND_LUNG_ANATOMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e72cfd1bca46.js`; view `visualization-de8c92cdf958.js` → `AnimalRespiratoryAirwayAndLungAnatomyVisualization`.

#### Mammalian pulmonary and systemic double circulation

Mammalian double circulation: the pulmonary circuit carries oxygen-poor blood from the right heart to the lungs and returns oxygen-rich blood to the left heart, while the systemic circuit carries it to body tissues and returns oxygen-poor blood to the right heart.

Type `ANIMAL_PULMONARY_AND_SYSTEMIC_CIRCULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c64ab2df2499.js`; view `visualization-bea626d7b0f8.js` → `AnimalPulmonaryAndSystemicCirculationVisualization`.

#### Mammalian urinary system anatomy

Type `MAMMALIAN_URINARY_SYSTEM_ANATOMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9183bd73705b.js`; view `visualization-9c1966175305.js` → `MammalianUrinarySystemAnatomyVisualization`.

#### Marine fish osmoregulation

Type `MARINE_FISH_OSMOREGULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c550cf95a1b9.js`; view `visualization-c4e522fa1099.js` → `MarineFishOsmoregulationVisualization`.

#### Mass-extinction survival and adaptive radiation

Type `MASS_EXTINCTION_SURVIVAL_AND_ADAPTIVE_RADIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8f0079451279.js`; view `visualization-dbbb8bb906eb.js` → `MassExtinctionSurvivalAndAdaptiveRadiationVisualization`.

#### Matched heterozygotes distinguish uniform blending from codominance

Type `INCOMPLETE_DOMINANCE_VERSUS_CODOMINANCE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-a0ef520456c3.js`; view `visualization-e99c51c6d898.js` → `IncompleteDominanceVersusCodominanceVisualization`.

#### Maternal allele silencing makes the same nuclear variant depend on its parent of origin

Type `GENOMIC_IMPRINTING_PARENT_OF_ORIGIN` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f8aac9842be6.js`; view `visualization-188eedd873d7.js` → `GenomicImprintingParentOfOriginVisualization`.

#### Maternal mitochondrial transmission compared with no paternal transmission

Type `MITOCHONDRIAL_MATERNAL_INHERITANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9cc835a152fb.js`; view `visualization-3e67195733c3.js` → `MitochondrialMaternalInheritanceVisualization`.

#### Matter cycles while energy flows

Why can atoms cycle through an ecosystem while usable energy must enter and leave? Distinguish conserved cycling matter from usable energy that enters as sunlight and leaves organisms as dispersed heat.

Type `BIOGEOCHEMICAL_MATTER_CYCLING_VERSUS_ENERGY_FLOW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f76c55fd1b22.js`; view `visualization-3abf11417f00.js` → `Visualization`.

#### Mature mRNA structure

Type `MATURE_MRNA_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-49869326c395.js`; view `visualization-486abcc72385.js` → `Visualization`.

#### Measured image size, actual specimen size, and magnification

Type `MICROSCOPY_IMAGE_SIZE_ACTUAL_SIZE_MAGNIFICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-aa7e4e9c7882.js`; view `visualization-3e76d4b33519.js` → `Visualization`.

#### Measurement accuracy and precision

Type `BIOLOGICAL_MEASUREMENT_ACCURACY_AND_PRECISION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8b3293eb3b2f.js`; view `visualization-8b6b5816e60a.js` → `BiologicalMeasurementAccuracyAndPrecisionVisualization`.

#### Meiosis I separates intact replicated homologs and reduces diploid cells to haploid

Type `HOMOLOGOUS_CHROMOSOME_SEGREGATION_MEIOSIS_ONE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4fd95528f685.js`; view `visualization-8ff1fba20647.js` → `Visualization`.

#### Meiosis II separates sister chromatids while preserving one haploid chromosome set

Type `SISTER_CHROMATID_SEGREGATION_MEIOSIS_TWO` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1933f57a34c9.js`; view `visualization-660b7dac6cc9.js` → `Visualization`.

#### Meiosis-I nondisjunction sends both homologs together and produces four abnormal gametes

Type `MEIOSIS_ONE_NONDISJUNCTION_SEGREGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-46c3ec3902e8.js`; view `visualization-9247249ee204.js` → `Visualization`.

#### Meiosis-II nondisjunction in one branch leaves two normal and two abnormal gametes

Type `MEIOSIS_TWO_NONDISJUNCTION_SEGREGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8520cf5c3419.js`; view `visualization-cd65bfd31244.js` → `Visualization`.

#### Membrane bilayer polarity

Type `MEMBRANE_BILAYER_POLARITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-549b648a502a.js`; view `visualization-684ef5cf96d8.js` → `MembraneBilayerPolarityVisualization`.

#### Membrane-bound compartments within one eukaryotic cell

Type `CELLULAR_COMPARTMENTALIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-47e4ca3ded08.js`; view `visualization-f2321a70e9fc.js` → `Visualization`.

#### Membrane-bound ligand signals a touching neighboring cell

A membrane-bound ligand on one cell binds the matching receptor of a touching neighbor, and only that target cell responds.

Type `DIRECT_CONTACT_CELL_SIGNALING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d8a0405176cd.js`; view `visualization-46cc9a79b008.js` → `DirectContactCellSignalingVisualization`.

#### Mendelian garden-pea P, F1, and F2 inheritance overview

Type `MENDELIAN_GENETICS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-9cd861e080d5.js`; view `visualization-a9253e3004d4.js` → `Visualization`.

#### Metamorphosis from larva to adult

Metamorphosis from larva to adult: A frog develops from an aquatic tadpole into a froglet as limbs emerge and the tail recedes; the resulting adult frog has a different body plan and no larval tail.

Type `ANIMAL_METAMORPHOSIS_LARVA_TO_ADULT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c0c9f0d5ebec.js`; view `visualization-1d55c307fbc4.js` → `AnimalMetamorphosisLarvaToAdultVisualization`.

#### Microscope illumination and image path

Type `MICROSCOPY_ILLUMINATION_TO_EYEPIECE_PATH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3c830228c3fc.js`; view `visualization-aadab4cb30ba.js` → `Visualization`.

#### Microscopy scale bar cell measurement

Type `MICROSCOPY_SCALE_BAR_CELL_MEASUREMENT` · manifest v1 · not in the type enum.

Source: manifest `type-e95d6b1ca1f3.js`; view `visualization-31770f466fce.js` → `Visualization`.

#### Microtubule polarity and growth

Explain how tubulin dimers add preferentially at a microtubule plus end while its minus end remains associated with the organizing center.

Type `MICROTUBULE_POLARITY_AND_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8b1bee59d525.js`; view `visualization-b92a6699fbda.js` → `Visualization`.

#### Missense amino-acid substitution

Type `MUTATION_MISSENSE_SUBSTITUTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b3afddd2f55b.js`; view `visualization-6c16716e18ce.js` → `Visualization`.

#### Mitochondrion structure and ATP production

Type `MITOCHONDRION_STRUCTURE_AND_ATP_PRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ac46f1238339.js`; view `visualization-e7d332ff79d6.js` → `Visualization`.

#### Molecular sequence similarity

Type `EVOLUTION_MOLECULAR_SEQUENCE_SIMILARITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ac1b1b4528e3.js`; view `visualization-85b802b33ae9.js` → `EvolutionMolecularSequenceSimilarityVisualization`.

#### Mollusk foot modifications

Type `ANIMAL_MOLLUSK_FOOT_MODIFICATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1df450b5a80b.js`; view `visualization-93e510ccadea.js` → `AnimalMolluskFootModificationsVisualization`.

#### Mollusk mantle, foot, and visceral mass

Type `ANIMAL_MOLLUSK_MANTLE_FOOT_VISCERAL_MASS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7142547afcd9.js`; view `visualization-a41bee7fb475.js` → `AnimalMolluskMantleFootVisceralMassVisualization`.

#### Monophyletic clade membership

Type `MONOPHYLETIC_CLADE_MEMBERSHIP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9cec470e9471.js`; view `visualization-472c1cf62119.js` → `Visualization`.

#### Moss gametophyte and sporophyte life cycle

Trace a dominant haploid moss gametophyte through sperm-egg fusion, a diploid zygote and attached sporophyte, meiosis in its capsule, and a haploid spore that establishes a new gametophyte.

Type `MOSS_GAMETOPHYTE_SPOROPHYTE_LIFE_CYCLE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-8887b8fd3dec.js`; view `visualization-961f3e84c13b.js` → `MossGametophyteSporophyteLifeCycleVisualization`.

#### Motile cilium axoneme structure

Interpret the 9+2 axonemal arrangement of nine outer microtubule doublets surrounding a central microtubule pair and identify dynein arms.

Type `MOTILE_CILIUM_AXONEME_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-30de38936a0c.js`; view `visualization-c891304c83fc.js` → `Visualization`.

#### Motor-unit recruitment and force

Type `MUSCULOSKELETAL_MOTOR_UNIT_RECRUITMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-eefe1b0d8c69.js`; view `visualization-7c47290ce043.js` → `MusculoskeletalMotorUnitRecruitmentVisualization`.

#### mRNA matches coding DNA except for thymine-to-uracil substitution

Type `CODING_STRAND_MRNA_SEQUENCE_RELATIONSHIP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-92ba5f9b9ddc.js`; view `visualization-4cf590c312c7.js` → `CodingStrandMrnaSequenceRelationshipVisualization`.

#### Multicellular cell, tissue, and organ hierarchy

Type `MULTICELLULAR_CELL_TISSUE_ORGAN_HIERARCHY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-eb93226f8795.js`; view `visualization-3cfd710b916d.js` → `Visualization`.

#### Multiple tissues build a functional organ

Type `MULTICELLULAR_TISSUES_BUILD_ORGANS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ef89c323f7bf.js`; view `visualization-96d2b38bae00.js` → `Visualization`.

#### Mutation codon reading frame

Type `MUTATION_CODON_READING_FRAME` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6ea333a284e9.js`; view `visualization-2d0fbc0c5817.js` → `Visualization`.

#### Mutation DNA to cellular phenotype

Type `MUTATION_DNA_RNA_PROTEIN_PHENOTYPE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-867ac10bacdb.js`; view `visualization-7f7c80a6637d.js` → `Visualization`.

#### Mutualism cleaning partnership

Type `MUTUALISM_CLEANING_PARTNERSHIP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-58a325bee689.js`; view `visualization-d17a470dd557.js` → `MutualismCleaningPartnershipVisualization`.

#### Mycorrhizal mutualism

Type `MYCORRHIZAL_MUTUALISM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ba78afa4c3b9.js`; view `visualization-8528398dbb4a.js` → `Visualization`.

#### Myelinated versus unmyelinated conduction

Equal-length axons carry equal-sized signals. The unmyelinated signal advances continuously, while the myelinated signal reaches exposed nodes and the endpoint sooner.

Type `MYELINATED_VERSUS_UNMYELINATED_CONDUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cd97efba78f5.js`; view `visualization-44db5951f23d.js` → `MyelinatedVersusUnmyelinatedConductionVisualization`.

#### Natural killer cell missing-self recognition

How does a natural killer cell detect an infected cell that has lost MHC I? Explain how natural killer cells preserve healthy MHC-I-positive host cells while recognizing reduced self-MHC I as one trigger for innate killing of an infected or abnormal cell.

Type `NATURAL_KILLER_CELL_MISSING_SELF_RECOGNITION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-a79320848a80.js`; view `visualization-b48bee807936.js` → `NaturalKillerCellMissingSelfRecognitionVisualization`.

#### Natural selection and differential reproduction

Type `NATURAL_SELECTION_DIFFERENTIAL_REPRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9f3be931acd6.js`; view `visualization-3982c4acc59d.js` → `NaturalSelectionDifferentialReproductionVisualization`.

#### Natural selection and differential survival

Type `NATURAL_SELECTION_DIFFERENTIAL_SURVIVAL` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b69500996b7c.js`; view `visualization-455fca773370.js` → `NaturalSelectionDifferentialSurvivalVisualization`.

#### Natural selection through differential reproduction

Type `POPULATION_GENETICS_SELECTION_DIFFERENTIAL_REPRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-60e2070dd38f.js`; view `visualization-fe6ba31210ad.js` → `Visualization`.

#### Nephron anatomy across cortex and medulla

Type `NEPHRON_ANATOMY_CORTEX_MEDULLA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1cf35a26845a.js`; view `visualization-bf8ff7646265.js` → `NephronAnatomyCortexMedullaVisualization`.

#### Nervous, muscular, and skeletal systems coordinate movement

Type `NERVOUS_MUSCULAR_SKELETAL_MOVEMENT` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-eceb82f62656.js`; view `visualization-f8cf0031f715.js` → `Visualization`.

#### Nested intestinal folds, villi, and epithelial microvilli

Intestinal absorption-surface comparison: broad folds carry many finger-like villi, and one villus epithelial cell bears a dense brush border of microvilli, so the three nested structural scales together increase the surface available for nutrient absorption.

Type `ANIMAL_INTESTINAL_FOLDS_VILLI_AND_MICROVILLI` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-46ee491c27f6.js`; view `visualization-c553b050ff0d.js` → `AnimalIntestinalFoldsVilliAndMicrovilliVisualization`.

#### Neuroendocrine negative feedback

Type `NEUROENDOCRINE_NEGATIVE_FEEDBACK` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d2c67a2d1e11.js`; view `visualization-5bfc601ea783.js` → `Visualization`.

#### Neuromuscular junction transmission

Type `MUSCULOSKELETAL_NEUROMUSCULAR_JUNCTION_TRANSMISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f682a67626fb.js`; view `visualization-d16abe6e4cf2.js` → `MusculoskeletalNeuromuscularJunctionTransmissionVisualization`.

#### Neuron anatomy and signal direction

A multipolar neuron has dendrites and a soma on the left, a continuous myelinated axon, and axon terminals on the right; a signal travels from dendrites toward terminals.

Type `NEURON_ANATOMY_AND_SIGNAL_DIRECTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-12666ffdf8fa.js`; view `visualization-779ac612f163.js` → `NeuronAnatomyAndSignalDirectionVisualization`.

#### Neuronal resting potential and ion gradients

A resting neuronal membrane has more sodium outside and potassium inside. An outward potassium leak contributes to a negative interior near minus 70 millivolts.

Type `NEURONAL_RESTING_POTENTIAL_ION_GRADIENTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ca7d004370ba.js`; view `visualization-d50c8a1b34d6.js` → `NeuronalRestingPotentialIonGradientsVisualization`.

#### Neurons and muscle cells express different genes from the same genome

Differential gene expression: nerve and muscle cells contain the same genes, but each activates its own associated gene and produces its matching RNA and proteins.

Type `NEURON_VERSUS_MUSCLE_GENE_EXPRESSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b8052381e876.js`; view `visualization-a439889652bf.js` → `Visualization`.

#### Neurons, synapses, and neural circuits

A neuron sends a directional electrical signal to a chemical synapse, and connected neurons form a central sensory-to-motor neural circuit.

Type `NEURONS_SYNAPSES_AND_NEURAL_CIRCUITS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f20bb932bb7c.js`; view `visualization-393736856e9f.js` → `NeuronsSynapsesAndNeuralCircuitsVisualization`.

#### Neurotransmitter reuptake and synaptic clearance

A neurotransmitter leaves its postsynaptic receptor, travels back into the presynaptic terminal through a reuptake transporter, and the postsynaptic signal ends.

Type `NEUROTRANSMITTER_REUPTAKE_AND_CLEARANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7c1af0bff819.js`; view `visualization-bc6b82bf66f7.js` → `NeurotransmitterReuptakeAndClearanceVisualization`.

#### Nitrification and denitrification

How do ammonium, nitrite, and nitrate connect before nitrogen returns to the atmosphere? Distinguish nitrification's ordered ammonium-to-nitrite-to-nitrate sequence from denitrification's nitrate-to-nitrogen-gas return.

Type `BIOGEOCHEMICAL_NITROGEN_NITRIFICATION_AND_DENITRIFICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-19d786cf3a01.js`; view `visualization-5fb52fcc9ab6.js` → `Visualization`.

#### Nitrogen ammonification and decomposition

How do decomposers return nitrogen from organic matter to soil as ammonium? Explain that decomposers convert nitrogen in organic wastes and remains into soil ammonium through ammonification.

Type `BIOGEOCHEMICAL_NITROGEN_AMMONIFICATION_AND_DECOMPOSITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d12b6f865d56.js`; view `visualization-2178562b98f0.js` → `Visualization`.

#### Nitrogen reservoirs and transformations

Which nitrogen forms connect the atmosphere, organisms, and soil? Distinguish atmospheric nitrogen gas, organic nitrogen, ammonium, nitrite, and nitrate and place them in their connected cycle.

Type `BIOGEOCHEMICAL_NITROGEN_RESERVOIRS_AND_TRANSFORMATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d15ab1bb70cb.js`; view `visualization-b460058a13ca.js` → `Visualization`.

#### Nonsense mutation premature stop

Type `MUTATION_NONSENSE_PREMATURE_STOP` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-65285c5241d7.js`; view `visualization-9982df78a19a.js` → `Visualization`.

#### Nonvascular epithelium and connective blood supply

Type `EPITHELIAL_NONVASCULAR_CONNECTIVE_TISSUE_BLOOD_SUPPLY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2553d85b2745.js`; view `visualization-60953797f523.js` → `EpithelialNonvascularConnectiveTissueBloodSupplyVisualization`.

#### Nonvascular versus vascular plants

Distinguish nonvascular mosses from vascular ferns by comparing localized surface absorption with connected conducting tissue.

Type `PLANT_NONVASCULAR_VERSUS_VASCULAR_TISSUE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8df93f6c376d.js`; view `visualization-b563387ad293.js` → `PlantNonvascularVersusVascularTissueVisualization`.

#### Normal cell contact stops growth while contact-insensitive cells keep piling up

Type `DENSITY_DEPENDENT_CONTACT_INHIBITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-84e53f4d916e.js`; view `visualization-afff641dd2a3.js` → `Visualization`.

#### Nucleic acids

DNA has two complementary strands with A-T and G-C base pairs, while RNA is usually one strand and uses U instead of T.

Type `NUCLEIC_ACIDS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-559d658f1bc7.js`; view `visualization-1490eabe126b.js` → `Visualization`.

#### Nucleic-acid polymerization

A new nucleotide joins the free 3-prime end of an existing strand, extending the strand in the 5-prime-to-3-prime direction and creating a new 3-prime end.

Type `NUCLEIC_ACID_POLYMERIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-15d314d9a413.js`; view `visualization-698247bc7638.js` → `Visualization`.

#### Nucleotide structure

One nucleotide contains a phosphate group attached to a five-carbon sugar and a nitrogenous base, with distinct 5-prime and 3-prime landmarks.

Type `NUCLEOTIDE_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-47efaf198b89.js`; view `visualization-dd0ee0efc0a8.js` → `Visualization`.

#### Nucleus and ribosome functions

Type `NUCLEUS_AND_RIBOSOME_FUNCTIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ee04370f5b4d.js`; view `visualization-33fd4de79958.js` → `Visualization`.

#### Nutrient runoff and eutrophication

Why can excess nitrogen or phosphorus runoff eventually reduce dissolved oxygen in a lake? Explain the causal sequence from excess nitrogen or phosphorus runoff to algal bloom, decomposer respiration, and lower dissolved oxygen.

Type `BIOGEOCHEMICAL_NUTRIENT_RUNOFF_AND_EUTROPHICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fd6b1f69df6b.js`; view `visualization-c1bc682cc8ed.js` → `Visualization`.

#### Objective power and field of view

Type `MICROSCOPY_OBJECTIVE_POWER_FIELD_OF_VIEW` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-d76cf63ba314.js`; view `visualization-a1bc1fb0d127.js` → `Visualization`.

#### Ocean-atmosphere carbon exchange

Can carbon dioxide move both into the ocean and back into the atmosphere? Explain that atmospheric and surface-ocean carbon exchange is bidirectional rather than a one-way permanent removal.

Type `BIOGEOCHEMICAL_CARBON_OCEAN_ATMOSPHERE_EXCHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5aeed8fabbff.js`; view `visualization-b7cf7747ee60.js` → `Visualization`.

#### Okazaki-fragment maturation and joining

Type `DNA_REPLICATION_OKAZAKI_FRAGMENT_JOINING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fd02dcfeacd9.js`; view `visualization-2dc688a7d0a9.js` → `DnaReplicationOkazakiFragmentJoiningVisualization`.

#### Oldest fossil and an unsampled ghost lineage

Type `OLDEST_FOSSIL_AND_UNSAMPLED_GHOST_LINEAGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-216aa557c026.js`; view `visualization-55316825bc94.js` → `OldestFossilAndUnsampledGhostLineageVisualization`.

#### One affected X allele passes from a grandfather through his carrier daughter to an affected grandson without father-to-son transmission

Type `MENDELIAN_X_LINKED_PEDIGREE_GRANDFATHER_TO_GRANDSON_TRANSMISSION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-385e9e52f941.js`; view `visualization-c32ddff47c30.js` → `Visualization`.

#### One aligned four-chromatid meiotic tetrad preserves maternal and paternal loci

Type `HOMOLOGOUS_CHROMOSOME_PAIRING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7b8c4c4307c7.js`; view `visualization-cfbe457539ac.js` → `Visualization`.

#### One bacterial cell compared with many cooperating animal cells

One bacterial cell functions as a complete unicellular organism, while four distinct animal cells cooperate as a tissue in a multicellular organism.

Type `CELL_THEORY_UNICELLULAR_AND_MULTICELLULAR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-138f34a0c4e3.js`; view `visualization-7f0cc500361c.js` → `Visualization`.

#### One bacterium biases run-and-tumble movement toward an attractant

Type `BACTERIAL_CHEMOTAXIS_RUN_AND_TUMBLE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d1b77d25749f.js`; view `visualization-fd770d48f497.js` → `BacterialChemotaxisRunAndTumbleVisualization`.

#### One biological outlier shifts the mean but not the median

Type `BIOLOGICAL_OUTLIER_EFFECTS_ON_MEAN_AND_MEDIAN` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-17e25ff46a6a.js`; view `visualization-7c05feaf6078.js` → `BiologicalOutlierEffectsOnMeanAndMedianVisualization`.

#### One cell secretes and receives its own extracellular signal

One cell secretes a signaling molecule into extracellular fluid, receives it at its own matching receptor, and responds to its own signal.

Type `AUTOCRINE_CELL_SIGNALING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ef11fd8d8bd3.js`; view `visualization-19aa770be08a.js` → `AutocrineCellSignalingVisualization`.

#### One chromosome before and after sister-chromatid duplication

Type `CHROMOSOME_SISTER_CHROMATID_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6b03cb5fae86.js`; view `visualization-ec4b7c10e1cd.js` → `Visualization`.

#### One diploid germ cell divides into four genetically distinguishable haploid gametes

Type `MEIOSIS_AND_GENETIC_DIVERSITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-903f216ef2d9.js`; view `visualization-d24a294cf7d5.js` → `Visualization`.

#### One DNA sequence substitution changes the corresponding RNA message

Type `DNA_SEQUENCE_CHANGE_RNA_MESSAGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c4fe17689039.js`; view `visualization-c0cba527bddd.js` → `DnaSequenceChangeRnaMessageVisualization`.

#### One enclosed secretory protein travels from rough ER through Golgi to outside

Type `ENDOMEMBRANE_TRAFFICKING` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-4d983c1481e8.js`; view `visualization-b92091f4bf3e.js` → `Visualization`.

#### One endocrine hormone travels through blood to a distant target

One endocrine hormone leaves its source, travels through a continuous blood vessel, and activates a matching receptor on a distant target cell.

Type `ENDOCRINE_LONG_DISTANCE_SIGNALING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f6c683cdbc60.js`; view `visualization-f83efeb4d6b6.js` → `EndocrineLongDistanceSignalingVisualization`.

#### One existing animal cell divides into two daughter cells

One pre-existing animal cell constricts and divides into exactly two daughter cells, showing that new cells arise from existing cells.

Type `CELL_THEORY_CELLS_FROM_EXISTING_CELLS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e98c48550afd.js`; view `visualization-c102aeff3270.js` → `Visualization`.

#### One extracellular ligand drives ordered reception, transduction, and response

Reception-to-response animation: one extracellular ligand binds its receptor, intracellular relay proteins activate in order, and the downstream cellular response switches on.

Type `RECEPTION_TRANSDUCTION_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d1c80e1d0db4.js`; view `visualization-ac67d7e54838.js` → `Visualization`.

#### One genotype responds phenotypically after environmental water increases

One plant keeps the same inherited genotype as its environmental water supply increases and its observable height subsequently grows.

Type `PHENOTYPIC_PLASTICITY_ENVIRONMENTAL_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2be4dee1b436.js`; view `visualization-2977dd9cbbb2.js` → `Visualization`.

#### One lipid-soluble hormone crosses the membrane and binds inside the cell

One lipid-soluble hormone crosses the plasma membrane, binds a receptor inside the cell, and travels with that receptor toward the nucleus.

Type `INTRACELLULAR_RECEPTOR_HORMONE_BINDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-be1fb62525a4.js`; view `visualization-20db43776ed3.js` → `IntracellularReceptorHormoneBindingVisualization`.

#### One morphogen concentration gradient specifies three genome-matched cell fates

Morphogen concentration and cell fate: one localized signal decreases across three stationary cells, so high, medium, and low exposures specify neuronal, muscular, and secretory identities even though each cell retains the same genome.

Type `MORPHOGEN_CONCENTRATION_AND_CELL_FATE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-91baef91fb80.js`; view `visualization-90cd04d04521.js` → `Visualization`.

#### One neurotransmitter crosses a short extracellular synaptic cleft

A neuron releases one neurotransmitter across a narrow synaptic cleft to the matching receptor of a postsynaptic target cell.

Type `SYNAPTIC_CELL_SIGNALING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-66f5a1e9f035.js`; view `visualization-95b116912a7c.js` → `SynapticCellSignalingVisualization`.

#### One Pp homologous allele pair segregates into separate haploid gametes

Type `MENDELIAN_ALLELE_SEGREGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8996a01b4d7e.js`; view `visualization-eac39a206b64.js` → `Visualization`.

#### One pre-mRNA containing three identifiable exons is alternatively spliced into two mature RNA exon combinations that encode different protein isoforms.

Type `ALTERNATIVE_RNA_SPLICING_PROTEIN_ISOFORMS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9bb3ea7504d6.js`; view `visualization-d8dd3587674e.js` → `Visualization`.

#### One receptor input becomes two, four, and eight countable activated downstream targets

Signal-amplification animation: one extracellular signal activates one receptor, then two, four, and finally eight individually countable downstream targets without creating any additional ligand.

Type `SIGNAL_AMPLIFICATION_CASCADE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-968519e2786a.js`; view `visualization-458172c68418.js` → `Visualization`.

#### One reciprocal prophase-I crossover changes only two non-sister chromatids

Type `MEIOTIC_CROSSING_OVER_RECOMBINATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e252b29c9c09.js`; view `visualization-733bb5287555.js` → `Visualization`.

#### One typical XY germ cell separates X and Y in meiosis I and produces two X-bearing and two Y-bearing gametes after meiosis II

Type `MEIOTIC_SEX_CHROMOSOME_SEGREGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-36434ad5d741.js`; view `visualization-5954d7883421.js` → `Visualization`.

#### One-base deletion frameshift

Type `MUTATION_DELETION_FRAMESHIFT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dae82b908220.js`; view `visualization-9f989a772d75.js` → `Visualization`.

#### One-base insertion frameshift

Type `MUTATION_INSERTION_FRAMESHIFT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cc1dd2f67540.js`; view `visualization-8aff7caf75ce.js` → `Visualization`.

#### Only the receptor-bearing cell responds to a shared extracellular signal

One signal passes a receptor-free bystander and binds a matching receptor on another cell; only the receptor-bearing target responds.

Type `TARGET_CELL_RECEPTOR_SPECIFICITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-89cfdf3518e2.js`; view `visualization-e4f4388081cb.js` → `TargetCellReceptorSpecificityVisualization`.

#### Open insect circulation versus closed fish circulation

Recognizable insect and fish circulation comparison: insect hemolymph leaves the dorsal vessel and directly bathes body tissues, while fish blood remains enclosed inside one connected closed blood-vessel circuit.

Type `ANIMAL_OPEN_VERSUS_CLOSED_CIRCULATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-14474e6a1a00.js`; view `visualization-4f67ed1ae0f8.js` → `AnimalOpenVersusClosedCirculationVisualization`.

#### Ordered AUG GCU ACC UAA mRNA codons produce Met Ala Thr and stop

Type `MRNA_CODON_AMINO_ACID_SEQUENCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ede2bb873d62.js`; view `visualization-bd5ff29476b4.js` → `MrnaCodonAminoAcidSequenceVisualization`.

#### Ordered chromosome alignment, attachment, separation, and nuclear reformation

Type `MITOSIS_CHROMOSOME_SEGREGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dace53f04818.js`; view `visualization-767fa04c127d.js` → `Visualization`.

#### Organic-carbon burial and long-term geological storage

How does a small fraction of organic carbon enter long-term geological storage? Compare ordinary decomposer-mediated atmospheric return with slow burial of some conserved organic carbon into geological storage.

Type `BIOGEOCHEMICAL_CARBON_BURIAL_AND_GEOLOGICAL_STORAGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-71205a4ffa8c.js`; view `visualization-be23e041d3c5.js` → `Visualization`.

#### Origin of life

Type `ORIGIN_OF_LIFE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d95bac035d6b.js`; view `visualization-121ab4d3961f.js` → `Visualization`.

#### Osmoregulator versus osmoconformer

Type `OSMOREGULATOR_VERSUS_OSMOCONFORMER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dc5c5dc65787.js`; view `visualization-d4f5eef0e6a4.js` → `OsmoregulatorVersusOsmoconformerVisualization`.

#### Osmosis across a selectively permeable membrane

Type `OSMOSIS_ACROSS_SELECTIVELY_PERMEABLE_MEMBRANE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9865b84bddc0.js`; view `visualization-2df2bed360a7.js` → `Visualization`.

#### Outgroup and rooted ingroup

Type `PHYLOGENETIC_OUTGROUP_ROOTING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f43d45b6ce67.js`; view `visualization-88455334bfd8.js` → `Visualization`.

#### Oviparous versus viviparous development

Oviparous versus viviparous development: Oviparous animals lay eggs that complete development outside the parent's body, while viviparous animals retain the developing offspring internally and later give birth to live young.

Type `ANIMAL_OVIPAROUS_VERSUS_VIVIPAROUS_DEVELOPMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-281c7b0fdce4.js`; view `visualization-8f0491891d41.js` → `AnimalOviparousVersusViviparousDevelopmentVisualization`.

#### Ovulation, fertilization, and implantation

Ovulation, fertilization, and implantation: An ovary releases an oocyte, fertilization usually occurs after it enters a uterine tube, and the developing embryo subsequently travels to and implants in the uterine lining.

Type `ANIMAL_OVULATION_FERTILIZATION_IMPLANTATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7fc66abbad67.js`; view `visualization-81d043fc9627.js` → `AnimalOvulationFertilizationImplantationVisualization`.

#### Paramecium cell structure

Type `PARAMECIUM_CELL_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1ca05a6f8caf.js`; view `visualization-217d3503d2d5.js` → `Visualization`.

#### Paramecium ciliary feeding

Type `PARAMECIUM_CILIARY_FEEDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2812b151314b.js`; view `visualization-5840f8be466f.js` → `Visualization`.

#### Paramecium conjugation genetic exchange

Type `PARAMECIUM_CONJUGATION_GENETIC_EXCHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-10c6b91f46d9.js`; view `visualization-13e908a7e49d.js` → `Visualization`.

#### Parasitism host exploitation

Type `PARASITISM_HOST_EXPLOITATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e2995816cc04.js`; view `visualization-ae9ea57a0246.js` → `ParasitismHostExploitationVisualization`.

#### Passive versus active membrane transport

Type `PASSIVE_VERSUS_ACTIVE_MEMBRANE_TRANSPORT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-60c0f2051182.js`; view `visualization-74df230e1a75.js` → `Visualization`.

#### Pasteur swan-neck control compared with airborne contamination

Two matched air-exposed flasks contain sterile broth. The intact swan neck traps airborne microbes and stays clear, while the broken neck admits a microbe and its broth turns cloudy.

Type `CELL_THEORY_PASTEUR_SWAN_NECK_EXPERIMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-176ec8799755.js`; view `visualization-62ec5f5f9816.js` → `Visualization`.

#### Pathogen types

How do bacteria, viruses, fungi, and protists differ? Distinguish the cellular bacterium, acellular virus, budding fungus, and nucleated protist as four structurally different categories that may contain pathogens.

Type `PATHOGEN_TYPES_BACTERIA_VIRUSES_FUNGI_PROTISTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fa708737a87c.js`; view `visualization-ea48627797b9.js` → `PathogenTypesBacteriaVirusesFungiProtistsVisualization`.

#### PCR exponential DNA amplification

A branching molecular PCR diagram starts with one DNA duplex and successively shows two, four, and eight traceable double-stranded target copies beside a recognizable thermal cycler.

Type `PCR_EXPONENTIAL_DNA_AMPLIFICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c5e965dedd58.js`; view `visualization-a0b13b7d61c3.js` → `Visualization`.

#### PCR primer-directed extension

Two separated DNA template strands receive inward-facing primers; two recognizable DNA polymerases extend opposite complementary product strands 5′ to 3′ across the same bounded target.

Type `PCR_PRIMER_DIRECTED_EXTENSION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-9286f48637e3.js`; view `visualization-d02e2979cd30.js` → `Visualization`.

#### PCR temperature cycle

Three adjacent molecular DNA states compare separated template strands at 95 °C, complementary primers bound near 55 °C, and newly synthesized complementary strands near 72 °C beside a recognizable thermal cycler.

Type `PCR_TEMPERATURE_CYCLE_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b1f5bdff361b.js`; view `visualization-ab1726584986.js` → `Visualization`.

#### Pepsin and trypsin have different pH activity optima

Type `ENZYME_PH_ACTIVITY_PROFILES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-514aee4664b9.js`; view `visualization-2b4e7996ae2f.js` → `Visualization`.

#### Peptide-bond formation

Type `PEPTIDE_BOND_FORMATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-74770209df91.js`; view `visualization-d70da50c53b9.js` → `PeptideBondFormationVisualization`.

#### Peroxisome catalase compartmentalizes hydrogen peroxide detoxification

Type `PEROXISOME_DETOXIFICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c73b720d8ff4.js`; view `visualization-bcd72dbb01f8.js` → `Visualization`.

#### pH and enzyme active-site charge

Type `BIOLOGICAL_PH_ENZYME_ACTIVE_SITE_CHARGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a9265b5284a6.js`; view `visualization-60cbe48b1638.js` → `Visualization`.

#### Phagocytosis and phagolysosome digestion

How does a phagocyte engulf and digest a captured bacterium? Explain how receptor-mediated engulfment encloses a pathogen in a phagosome and lysosome fusion creates a degradative phagolysosome.

Type `IMMUNE_PHAGOCYTOSIS_PHAGOLYSOSOME_DIGESTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-47fb4096cea6.js`; view `visualization-701805f87b74.js` → `ImmunePhagocytosisPhagolysosomeDigestionVisualization`.

#### Phanerozoic Paleozoic, Mesozoic, and Cenozoic eras

Type `PHANEROZOIC_PALEOZOIC_MESOZOIC_CENOZOIC_ERAS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-582c2660c9dc.js`; view `visualization-4c2ea271a07e.js` → `PhanerozoicPaleozoicMesozoicCenozoicErasVisualization`.

#### Phloem source-to-sink sugar transport

Sugars moving from a mature source leaf through phloem toward both an upper growing shoot and a lower storage root

Type `PLANT_PHLOEM_SOURCE_TO_SINK_TRANSPORT` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-9a2cd7c5afe7.js`; view `visualization-38c0d3e5800e.js` → `Visualization`.

#### Phosphate functional-group structure and negative charge

Type `BIOLOGICAL_PHOSPHATE_FUNCTIONAL_GROUP_CHARGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e70e31610f3c.js`; view `visualization-4d35988b074e.js` → `Visualization`.

#### Phospholipid bilayer self-assembly

Type `PHOSPHOLIPID_BILAYER_SELF_ASSEMBLY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dd0c1b24d29b.js`; view `visualization-7883050dfcf8.js` → `PhospholipidBilayerSelfAssemblyVisualization`.

#### Phospholipid structure and polarity

Type `PHOSPHOLIPID_STRUCTURE_POLARITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f39f27209112.js`; view `visualization-43b1437ae8c1.js` → `PhospholipidStructurePolarityVisualization`.

#### Phosphorus from rock to the food web

How does phosphate leave rock, enter living organisms, and return to the soil? Explain how weathering releases phosphate into soil, producers assimilate it, consumers obtain it through feeding, and decomposition returns phosphate for reuse.

Type `BIOGEOCHEMICAL_PHOSPHORUS_ROCK_TO_FOOD_WEB` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4b9d5cc2789d.js`; view `visualization-a43a87970640.js` → `Visualization`.

#### Phosphorus has no major atmospheric reservoir

Why does the phosphorus cycle differ from the carbon and nitrogen cycles? Distinguish phosphorus's mainly geological, aquatic, and biological reservoirs from the major atmospheric gas reservoirs of carbon and nitrogen.

Type `BIOGEOCHEMICAL_PHOSPHORUS_NO_ATMOSPHERIC_RESERVOIR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-22a22f45a358.js`; view `visualization-3e370595a8f8.js` → `Visualization`.

#### Phosphorus sedimentation and uplift

How does phosphorus return from aquatic sediment to land over geological time? Explain why sediment burial, rock formation, and geological uplift close the phosphorus cycle much more slowly than biological recycling.

Type `BIOGEOCHEMICAL_PHOSPHORUS_SEDIMENTATION_AND_UPLIFT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b55fe341963b.js`; view `visualization-62d3aa514e8e.js` → `Visualization`.

#### Photosynthesis and respiration carbon exchange

How does one carbon atom move from atmospheric carbon dioxide into a food web and back into the air? Trace the same carbon from atmospheric carbon dioxide into producer and consumer biomass and back to the atmosphere through respiration.

Type `BIOGEOCHEMICAL_CARBON_PHOTOSYNTHESIS_RESPIRATION_EXCHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-601faaaa2b3f.js`; view `visualization-d2fb9af40913.js` → `Visualization`.

#### Photosynthesis Calvin-cycle carbon accounting

Type `PHOTOSYNTHESIS_CALVIN_CYCLE_CARBON_ACCOUNTING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4b69eb2051a2.js`; view `visualization-bc6d31ee3859.js` → `Visualization`.

#### Photosynthesis chemiosmosis and ATP production

Type `PHOTOSYNTHESIS_CHEMIOSMOSIS_ATP_PRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d944714824d1.js`; view `visualization-1214f9eb3835.js` → `Visualization`.

#### Photosynthesis chloroplast organization

Type `PHOTOSYNTHESIS_CHLOROPLAST_ORGANIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5813e9552d88.js`; view `visualization-d4ea21808cdb.js` → `Visualization`.

#### Photosynthesis light and carbon-dioxide limitation

Type `PHOTOSYNTHESIS_LIGHT_CARBON_DIOXIDE_LIMITATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7439b956bf95.js`; view `visualization-7df30776c39a.js` → `Visualization`.

#### Photosynthesis light reaction and Calvin-cycle coupling

Type `PHOTOSYNTHESIS_LIGHT_CALVIN_STAGE_COUPLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b4093a0b5b43.js`; view `visualization-e534383d88b7.js` → `Visualization`.

#### Photosynthesis matter and energy inputs and outputs

Type `PHOTOSYNTHESIS_MATTER_ENERGY_INPUTS_OUTPUTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3ea07158b348.js`; view `visualization-ea576f2babb9.js` → `Visualization`.

#### Photosynthesis stomatal water and carbon tradeoff

Type `PHOTOSYNTHESIS_STOMATAL_WATER_CARBON_TRADEOFF` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1e708a76dbab.js`; view `visualization-430878fe725c.js` → `Visualization`.

#### Photosynthesis thylakoid proton gradient

Type `PHOTOSYNTHESIS_THYLAKOID_PROTON_GRADIENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-38c90aa02cfd.js`; view `visualization-bfd62ecf2f59.js` → `Visualization`.

#### Photosynthesis water splitting and oxygen release

Type `PHOTOSYNTHESIS_WATER_SPLITTING_OXYGEN_RELEASE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a6a40f3e6ad7.js`; view `visualization-a86ec26c4b32.js` → `Visualization`.

#### Photosynthesis: water to NADPH through PSII, ETC, and PSI

Type `PHOTOSYNTHESIS_LIGHT_REACTION_ELECTRON_TRANSPORT` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-3d6c55d30edf.js`; view `visualization-6c1a6e6bf93e.js` → `Visualization`.

#### Photosynthetic producers and consuming organisms

Type `LIFE_PHOTOSYNTHETIC_VERSUS_CONSUMING_ORGANISMS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-957f4059bcf0.js`; view `visualization-ae786c4e1d28.js` → `Visualization`.

#### Phototropism auxin redistribution

Type `PHOTOTROPISM_AUXIN_REDISTRIBUTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-730ccc93b238.js`; view `visualization-89b09e140df7.js` → `Visualization`.

#### Phylogenetic branch rotation invariance

Type `PHYLOGENETIC_TREE_ROTATION_INVARIANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3450bd7547c0.js`; view `visualization-507e00707aef.js` → `Visualization`.

#### Phylogeny and common ancestry overview

Type `PHYLOGENY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2b8c3230c712.js`; view `visualization-2ea1c3f7e669.js` → `Visualization`.

#### Phytochrome night interruption

Type `PHYTOCHROME_NIGHT_INTERRUPTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6d2ee197824e.js`; view `visualization-e539055ed5b4.js` → `Visualization`.

#### Placental maternal-fetal exchange

Placental maternal-fetal exchange: Maternal and fetal circulations remain physically separate at the placenta; oxygen and nutrients cross toward fetal blood, while fetal carbon dioxide and other wastes cross in the opposite direction toward maternal blood.

Type `ANIMAL_PLACENTAL_MATERNAL_FETAL_EXCHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1b121da66991.js`; view `visualization-3ed81a234118.js` → `AnimalPlacentalMaternalFetalExchangeVisualization`.

#### Plant cell structure and function

Type `PLANT_CELL_STRUCTURE_AND_FUNCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3112f6a513b6.js`; view `visualization-a439ab28f3ec.js` → `Visualization`.

#### Plant cell wall and animal extracellular-matrix overview

Plant cell supported by an exterior cellulose wall and animal cell attached to an exterior extracellular matrix; both have a plasma membrane.

Type `CELLULAR_ENVIRONMENT_INTERACTIONS_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c20397973282.js`; view `visualization-c9a5248b521f.js` → `Visualization`.

#### Plant cell wall, membrane, and vacuole

Type `PLANT_CELL_WALL_MEMBRANE_AND_VACUOLE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9ed00bb79a1b.js`; view `visualization-f8880e2f0eae.js` → `Visualization`.

#### Plant diversity and life cycles

Compare four major living land-plant groups by their recognizable body forms and their spore-based or seed-based reproduction.

Type `PLANT_DIVERSITY_AND_LIFE_CYCLES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5a4bba801ffe.js`; view `visualization-325839057664.js` → `PlantDiversityAndLifeCyclesVisualization`.

#### Plant evolution: vascular tissue, seeds, and flowers

Place vascular tissue, seeds, and flowers at successive shared-ancestry branch points without portraying living lineages as a linear ladder.

Type `PLANT_EVOLUTION_VASCULAR_TISSUE_SEEDS_AND_FLOWERS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c08e9adeca21.js`; view `visualization-f781138dd356.js` → `PlantEvolutionVascularTissueSeedsAndFlowersVisualization`.

#### Plant photosynthesis inputs are sunlight, carbon dioxide, and water

A whole plant uses sunlight, carbon dioxide, and water to make sugar and release oxygen.

Type `PHOTOSYNTHESIS_INPUTS_SUGAR_OXYGEN_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-31d40876948d.js`; view `visualization-dd9424e330ba.js` → `Visualization`.

#### Plant respiration continues as daytime photosynthesis gives way to night

A plant takes in carbon dioxide and releases oxygen in daylight, then takes in oxygen and releases carbon dioxide at night while respiration continues throughout.

Type `PLANT_PHOTOSYNTHESIS_AND_RESPIRATION_DAY_NIGHT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c60f2e059d80.js`; view `visualization-89a0e31b3819.js` → `Visualization`.

#### Plant root and shoot system interdependence

Type `PLANT_ROOT_SHOOT_SYSTEM_INTERDEPENDENCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-34882bf4bb7d.js`; view `visualization-7c8f4ef36617.js` → `Visualization`.

#### Plant root-water uptake and leaf transpiration

How does soil water move through plants back into the atmosphere? Trace one conserved water marker from soil pore water through plant roots and leaves into the atmospheric reservoir by transpiration.

Type `BIOGEOCHEMICAL_WATER_PLANT_UPTAKE_AND_TRANSPIRATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ca8bf97e182d.js`; view `visualization-ddcb2b6540e9.js` → `Visualization`.

#### Plant spores versus seeds

Compare a haploid single-celled spore with a seed containing a multicellular embryo, protective coat, and stored food.

Type `PLANT_SPORES_VERSUS_SEEDS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-11635086c77a.js`; view `visualization-c3e44059b381.js` → `PlantSporesVersusSeedsVisualization`.

#### Plant statolith gravity sensing

Type `PLANT_STATOLITH_GRAVITY_SENSING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-87082793c117.js`; view `visualization-1be4f849c956.js` → `Visualization`.

#### Plant-cell turgidity, flaccidity, and plasmolysis across three tonicities

Type `PLANT_CELL_TONICITY_COMPARISON` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-473636c1b4a2.js`; view `visualization-b7af685515e2.js` → `Visualization`.

#### Plant-made sugar moves into root storage and supports new growth

Sugar made in a plant leaf moves down the stem into root storage and helps the plant grow new tissue.

Type `PLANT_SUGAR_STORAGE_AND_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1bb10f568067.js`; view `visualization-8825e31dc420.js` → `Visualization`.

#### Plant, fungal, and animal cell structures

Type `LIFE_PLANT_ANIMAL_FUNGAL_CELL_STRUCTURES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-43d87d417522.js`; view `visualization-17ee99b32592.js` → `Visualization`.

#### Plants and animals exchange matter while energy enters and leaves

A whole plant and animal exchange food, oxygen, carbon dioxide, and water while sunlight enters and heat leaves.

Type `MATTER_AND_ENERGY_IN_WHOLE_ORGANISMS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9346786336cc.js`; view `visualization-81b43be5c34f.js` → `Visualization`.

#### Plasma membrane as a cell boundary

Type `PLASMA_MEMBRANE_CELL_BOUNDARY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f17429136507.js`; view `visualization-3cda65927d1a.js` → `Visualization`.

#### Plasma membrane fluid-mosaic architecture

Type `PLASMA_MEMBRANE_FLUID_MOSAIC_ARCHITECTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d88acbd7550a.js`; view `visualization-c476e97ac131.js` → `Visualization`.

#### Plasmid sticky-end ligation

An open circular plasmid and donor DNA each expose complementary sticky ends; both donor ends align, ligase seals two junctions, and the closed recombinant plasmid retains a conspicuous donor insert.

Type `PLASMID_STICKY_END_LIGATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-1d40c81439ff.js`; view `visualization-84d93978134d.js` → `Visualization`.

#### Platelet recruitment amplifies until the same vessel wound is sealed

A first platelet adheres to an open blood-vessel wound, recruits additional individually tracked platelets, and forms a plug that seals the opening and stops further recruitment.

Type `POSITIVE_FEEDBACK_BLOOD_CLOTTING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b02b2dfd921a.js`; view `visualization-d92ebdc6b9b7.js` → `PositiveFeedbackBloodClottingVisualization`.

#### Pollen fertilization without standing water

Follow pollen landing on a recognizable flower, internal pollen-tube sperm transport to a protected haploid egg, and formation of a visible diploid zygote without an external water film.

Type `PLANT_POLLEN_FERTILIZATION_WITHOUT_STANDING_WATER` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-a7661cf22b89.js`; view `visualization-cd2768bbfcce.js` → `PlantPollenFertilizationWithoutStandingWaterVisualization`.

#### Pollen transfer during pollination

A bee carrying one continuous pollen grain from the anther of one flower to the receptive stigma of another flower

Type `PLANT_POLLINATION_POLLEN_TRANSFER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-66f677011260.js`; view `visualization-bbe84de74abe.js` → `Visualization`.

#### Pollen-tube growth and fertilization

Pollen already on a stigma grows a tube through the style, delivers a male gamete into an ovule, and ends with a visibly fertilized ovule inside the ovary

Type `PLANT_POLLEN_TUBE_FERTILIZATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-1ef887f46e6e.js`; view `visualization-56ebd03ba442.js` → `Visualization`.

#### Pollination, fertilization, and seed formation

Flowering-plant reproduction: a bee transfers pollen to a flower, reproductive material reaches an ovule, and fertilization leads to a new seed.

Type `ORGANISM_POLLINATION_FERTILIZATION_AND_SEEDS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-456f40972751.js`; view `visualization-1bbb384f000a.js` → `OrganismPollinationFertilizationAndSeedsVisualization`.

#### Population adaptation across generations

Type `POPULATION_ADAPTATION_ACROSS_GENERATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e363e27a2e77.js`; view `visualization-b58bc322f637.js` → `PopulationAdaptationAcrossGenerationsVisualization`.

#### Population bottleneck and persistent variation loss

Type `POPULATION_GENETICS_BOTTLENECK_EFFECT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d3c203a3615d.js`; view `visualization-a30ea94013f8.js` → `Visualization`.

#### Population ecology and environmental limits

Type `POPULATION_ECOLOGY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-33388a0d2369.js`; view `visualization-784d813aa5de.js` → `Visualization`.

#### Population genetics and evolutionary mechanisms

Type `POPULATION_GENETICS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f47a75a6fa96.js`; view `visualization-43dc1a1d2bcb.js` → `Visualization`.

#### Population size and genetic-drift magnitude

Type `POPULATION_GENETICS_POPULATION_SIZE_AND_DRIFT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9c814862b668.js`; view `visualization-2f86aebd59c4.js` → `Visualization`.

#### Posterior pituitary neurohormone release

Type `POSTERIOR_PITUITARY_NEUROHORMONE_RELEASE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2294a8d7b5d0.js`; view `visualization-ca5aa419e10b.js` → `Visualization`.

#### Postsynaptic potential summation

Excitatory and inhibitory inputs converge on one neuron. Inhibition first keeps the net voltage below threshold; additional excitation reaches threshold and triggers an axonal action potential.

Type `POSTSYNAPTIC_POTENTIAL_SUMMATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ec07fcfd2e5c.js`; view `visualization-4dc70661f605.js` → `PostsynapticPotentialSummationVisualization`.

#### PP and Pp are purple while only pp expresses the white recessive phenotype

Type `MENDELIAN_GENOTYPE_PHENOTYPE_DOMINANCE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-d879e1d7aee6.js`; view `visualization-a77339a3fd9e.js` → `Visualization`.

#### PP, Pp, and pp parental genotypes predict distinct one-allele gametes

Type `MENDELIAN_GAMETE_FORMATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-417542ada9fc.js`; view `visualization-b1fe6e0b380e.js` → `Visualization`.

#### Pre-existing genetic variation and environmental disturbance

Type `BIODIVERSITY_GENETIC_VARIATION_ENVIRONMENTAL_CHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e170c982f551.js`; view `visualization-a1e2cf20e20b.js` → `Visualization`.

#### Pre-mRNA exon and intron structure

Type `PRE_MRNA_EXON_INTRON_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-56a4ca180bc0.js`; view `visualization-cd79f958584a.js` → `Visualization`.

#### Pre-mRNA intron splicing

Type `PRE_MRNA_INTRON_SPLICING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-431599afd2c5.js`; view `visualization-2b5dcb33f10c.js` → `Visualization`.

#### Pre-mRNA processing

Type `PRE_MRNA_PROCESSING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-49cdf9fb2e2a.js`; view `visualization-4cc94621ba2b.js` → `Visualization`.

#### Prebiotic organic-molecule synthesis

Type `PREBIOTIC_ORGANIC_MOLECULE_SYNTHESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ad9c84116c3e.js`; view `visualization-3022598451cc.js` → `Visualization`.

#### Predation energy and population effects

Type `PREDATION_ENERGY_AND_POPULATION_EFFECTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9a0afcf611ce.js`; view `visualization-c67ffc0eb514.js` → `PredationEnergyAndPopulationEffectsVisualization`.

#### Predator reintroduction trophic recovery

Type `PREDATOR_REINTRODUCTION_TROPHIC_RECOVERY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-38f3976a9f65.js`; view `visualization-23222a652164.js` → `PredatorReintroductionTrophicRecoveryVisualization`.

#### Predator removal trophic cascade

Type `PREDATOR_REMOVAL_TROPHIC_CASCADE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c87ab31932ad.js`; view `visualization-286fed57193d.js` → `PredatorRemovalTrophicCascadeVisualization`.

#### Prepare a wet-mount microscope slide

Type `MICROSCOPY_WET_MOUNT_SLIDE_PREPARATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9ee7adca7cb4.js`; view `visualization-b112080ce4ab.js` → `Visualization`.

#### Primary amino-acid sequence determines protein fold

Type `PROTEIN_PRIMARY_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-db2739ae4e9e.js`; view `visualization-ecd69b4ffc7d.js` → `ProteinPrimaryStructureVisualization`.

#### Primary and secondary immune response

Why is a second response to the same antigen faster and larger? Interpret the standard antibody-versus-time curves to explain why antigen-specific immune memory yields a faster and greater response upon re-exposure to the same antigen.

Type `IMMUNE_MEMORY_SECONDARY_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-525fa85740da.js`; view `visualization-dd9e5438bcf0.js` → `ImmuneMemorySecondaryResponseVisualization`.

#### Primary sensory cilium compared with multiple motile cilia

Distinguish a typical nonmotile 9+0 primary sensory cilium from 9+2 motile cilia by their axonemal structure, dynein arms, abundance, and cellular function.

Type `PRIMARY_VERSUS_MOTILE_CILIA` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-22e1b8e54a6d.js`; view `visualization-495d390d8b33.js` → `Visualization`.

#### Primary succession community assembly

Type `PRIMARY_SUCCESSION_COMMUNITY_ASSEMBLY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b1c99b0e9519.js`; view `visualization-8b9bb947649a.js` → `PrimarySuccessionCommunityAssemblyVisualization`.

#### Producer to consumer energy transfer

Type `PRODUCER_TO_CONSUMER_ENERGY_TRANSFER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bc6a88a45b34.js`; view `visualization-ec184acbab91.js` → `Visualization`.

#### Programmed interdigital cell death separates a recognizable developing hand

Developmental apoptosis and digit separation: one recognizable developing hand begins with webbed fingers, selected cells between its digits undergo orderly programmed removal, and the same separated fingers and connected living palm remain.

Type `DEVELOPMENTAL_APOPTOSIS_AND_DIGIT_SEPARATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5708de5d2d55.js`; view `visualization-9e0c158377dd.js` → `Visualization`.

#### Prokaryotic cell organization

Type `PROKARYOTIC_CELL_ORGANIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-87edb06effd5.js`; view `visualization-1136202d5659.js` → `Visualization`.

#### Promoter and RNA polymerase initiation

Type `PROMOTER_RNA_POLYMERASE_INITIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7240b8a55edc.js`; view `visualization-da220e10920a.js` → `Visualization`.

#### Promoter-associated DNA methylation accumulates on an unchanged DNA sequence, reduces transcriptional access, and silences mRNA production.

Type `DNA_METHYLATION_TRANSCRIPTIONAL_SILENCING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-681a2655f19a.js`; view `visualization-8b81d075c65c.js` → `Visualization`.

#### Prophase, metaphase, anaphase, and telophase comparison

Type `MITOSIS_PHASE_SEQUENCE_OVERVIEW` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bcf4f215a71f.js`; view `visualization-984b531c19b8.js` → `Visualization`.

#### Proteins: four levels of structure and functional shape

Type `PROTEINS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-256a9cb0a0be.js`; view `visualization-34f07e192b56.js` → `ProteinsVisualization`.

#### Protist binary fission

Type `PROTIST_BINARY_FISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3c3b810eebf1.js`; view `visualization-372017297167.js` → `Visualization`.

#### Protist diversity and nutrition

Type `PROTIST_DIVERSITY_AND_NUTRITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bd028d9729f9.js`; view `visualization-2036f3be2105.js` → `Visualization`.

#### Protist locomotion mechanisms

Type `PROTIST_LOCOMOTION_MECHANISMS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6748a0cc812e.js`; view `visualization-b40ce8695126.js` → `Visualization`.

#### Protocell membrane self-assembly

Type `PROTOCELL_MEMBRANE_SELF_ASSEMBLY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-65e5956bead2.js`; view `visualization-fcd8e2e16e05.js` → `Visualization`.

#### Protostome versus deuterostome development

Type `ANIMAL_PROTOSTOME_VERSUS_DEUTEROSTOME_DEVELOPMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-36f42c0631b0.js`; view `visualization-d7fac78017ff.js` → `AnimalProtostomeVersusDeuterostomeDevelopmentVisualization`.

#### Pyruvate oxidation carbon transfer

Type `PYRUVATE_OXIDATION_CARBON_TRANSFER` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-22451dfcee89.js`; view `visualization-ee347f6d6f91.js` → `PyruvateOxidationCarbonTransferVisualization`.

#### Quaternary protein subunit assembly

Type `PROTEIN_QUATERNARY_ASSEMBLY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c3c73ddc9a67.js`; view `visualization-c5d583559b82.js` → `ProteinQuaternaryAssemblyVisualization`.

#### Radial versus bilateral animal symmetry

Type `ANIMAL_RADIAL_VERSUS_BILATERAL_SYMMETRY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b96e0196f8fc.js`; view `visualization-ca0aed9e5ca5.js` → `AnimalRadialVersusBilateralSymmetryVisualization`.

#### Random biological sampling and selection bias

Type `BIOLOGICAL_RANDOM_SAMPLING_AND_SELECTION_BIAS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3ffcf202f4bc.js`; view `visualization-7ea5f4483955.js` → `BiologicalRandomSamplingAndSelectionBiasVisualization`.

#### Random genetic drift through chance sampling

Type `POPULATION_GENETICS_RANDOM_GENETIC_DRIFT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-da43ebb83605.js`; view `visualization-8f0fd4dacfd6.js` → `Visualization`.

#### Reception, intracellular transduction, and response in one target cell

Signal-transduction architecture: an extracellular ligand binds a membrane receptor during reception, intracellular relay proteins carry the signal during transduction, and an activated target produces the cellular response.

Type `SIGNAL_TRANSDUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7d3e23e63010.js`; view `visualization-5dd410ec8657.js` → `Visualization`.

#### Reciprocal crossover preserves parental and recombinant chromatid products

Type `LINKED_GENE_RECOMBINATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e21ff116a578.js`; view `visualization-ed20e7c51a44.js` → `LinkedGeneRecombinationVisualization`.

#### Recognizable blood, nerve, and muscle cells perform complementary jobs

Type `SPECIALIZED_CELLS_AND_DIVISION_OF_LABOR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-23270fc37604.js`; view `visualization-51cccfc12434.js` → `Visualization`.

#### Recognizable DNA and RNA polymerases make two DNA duplexes or one RNA strand from the same DNA

Type `DNA_REPLICATION_VERSUS_TRANSCRIPTION_PRODUCTS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ec4662dd36a9.js`; view `visualization-46c291c0fdba.js` → `DnaReplicationVersusTranscriptionProductsVisualization`.

#### Recognizable fish single circulation versus mammalian double circulation

Recognizable fish and mammal circulation comparison: the fish's exposed gills and heart form a single heart-to-gills-to-body circuit with one heart passage, while the mammal's lungs and divided heart form connected pulmonary and systemic circuits with two heart passages.

Type `ANIMAL_SINGLE_VERSUS_DOUBLE_CIRCULATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-5166bb8452fd.js`; view `visualization-21b9285ef0a6.js` → `AnimalSingleVersusDoubleCirculationVisualization`.

#### Recognizable pea pollen and ovule fuse into a Pp zygote before a subordinate purple-flower phenotype appears

Type `MENDELIAN_RANDOM_FERTILIZATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-b9a71ab31d05.js`; view `visualization-88178b3fa838.js` → `Visualization`.

#### Recombinant DNA plasmid workflow

One conspicuous donor gene joins an initially empty circular plasmid; the same thick donor arc stays visible on the recombinant ring and on that same recombinant plasmid inside a recognizable bacterial host.

Type `RECOMBINANT_DNA_PLASMID_WORKFLOW` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-eb58d40a2be5.js`; view `visualization-2d7735e59847.js` → `Visualization`.

#### Reductional meiosis I separates homologs while equational meiosis II separates sisters

Type `MEIOSIS_ONE_VERSUS_MEIOSIS_TWO` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-eab69d4e0986.js`; view `visualization-2fc2971acc0f.js` → `Visualization`.

#### Reflex-arc neural-circuit wiring

A hand supplies afferent sensory input to the spinal cord, a central interneuron relays the signal, and an efferent motor neuron activates a skeletal-muscle effector.

Type `REFLEX_ARC_NEURAL_CIRCUIT_WIRING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-884bf18a6de5.js`; view `visualization-65fc3ea713cc.js` → `ReflexArcNeuralCircuitWiringVisualization`.

#### Relative versus radiometric fossil dating

Type `RELATIVE_VERSUS_RADIOMETRIC_FOSSIL_DATING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5dac37ab176d.js`; view `visualization-64c3071a3380.js` → `RelativeVersusRadiometricFossilDatingVisualization`.

#### Repairable DNA damage permits survival while irreparable damage triggers apoptosis

Type `DNA_DAMAGE_REPAIR_VERSUS_APOPTOSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2d9552d87b54.js`; view `visualization-fea41f42447a.js` → `Visualization`.

#### Replication-fork architecture

Type `DNA_REPLICATION_FORK_ARCHITECTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-84a825f34b15.js`; view `visualization-bbbc8e7cdbe0.js` → `DnaReplicationForkArchitectureVisualization`.

#### Representative bacterial, animal, and plant cells on a logarithmic scale

Representative bacterial, animal, and plant cells align with equally spaced logarithmic scale marks at 1, 10, and 100 micrometers; each step represents a tenfold increase.

Type `CELL_THEORY_CELL_SIZE_SCALE_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4918d12b14e8.js`; view `visualization-21dbfeae2655.js` → `Visualization`.

#### Resource partitioning habitat zones

Type `RESOURCE_PARTITIONING_HABITAT_ZONES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-719c392ffb20.js`; view `visualization-8ce1eabbefaf.js` → `ResourcePartitioningHabitatZonesVisualization`.

#### Restriction digest gel band patterns

One linear DNA molecule contains two marked restriction sites; its uncut lane retains one high band, while a digested lane contains three size-ordered bands beside a DNA ladder.

Type `RESTRICTION_DIGEST_GEL_BAND_PATTERNS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-40644034cec7.js`; view `visualization-131f29d9fdfe.js` → `Visualization`.

#### Restriction enzyme recognition sites

Two double-stranded DNA sequences compare the canonical EcoRI recognition palindrome GAATTC/CTTAAG with a one-base nonmatching sequence; offset cut marks identify the matching site's staggered cleavage positions.

Type `RESTRICTION_ENZYME_RECOGNITION_SITES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-65a92b70efc5.js`; view `visualization-c7d4b7a9f5b2.js` → `Visualization`.

#### Restriction enzyme sticky-end cleavage

One intact DNA duplex recruits a recognizable restriction endonuclease to its marked recognition sequence, acquires staggered cuts, and separates into two products with conspicuous complementary sticky ends.

Type `RESTRICTION_ENZYME_STICKY_END_CLEAVAGE` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-8d101a5ae687.js`; view `visualization-e0713efc199a.js` → `Visualization`.

#### Retinal phototransduction and hyperpolarization

Type `SENSORY_RETINAL_PHOTOTRANSDUCTION_HYPERPOLARIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-32d2e210b282.js`; view `visualization-4e4efc24f112.js` → `Visualization`.

#### Reversible macromolecule dehydration synthesis and hydrolysis

Type `MACROMOLECULE_DEHYDRATION_HYDROLYSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3944760eb043.js`; view `visualization-9443b9c8cc8e.js` → `Visualization`.

#### Ribosome E exit, P peptidyl, and A aminoacyl sites

Type `RIBOSOME_A_P_E_SITES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4afe8158dd2f.js`; view `visualization-71422f5062e3.js` → `RibosomeAPESitesVisualization`.

#### RNA polymerase reads a DNA template and extends RNA five to three prime

Type `RNA_POLYMERASE_TEMPLATE_DIRECTED_SYNTHESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9a2714f81251.js`; view `visualization-7524c2ca23c5.js` → `RnaPolymeraseTemplateDirectedSynthesisVisualization`.

#### RNA polymerase template-strand reading

Type `RNA_POLYMERASE_TEMPLATE_STRAND_READING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cf97b8333197.js`; view `visualization-a38eb15e7a70.js` → `Visualization`.

#### RNA primer initiates DNA synthesis

Type `DNA_REPLICATION_RNA_PRIMER_INITIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ba1da8d050b8.js`; view `visualization-b043455ef87f.js` → `DnaReplicationRnaPrimerInitiationVisualization`.

#### RNA template-directed replication

Type `RNA_TEMPLATE_DIRECTED_REPLICATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-218e81c32abc.js`; view `visualization-4b558a2beab4.js` → `Visualization`.

#### RNA-world information and catalysis

Type `RNA_WORLD_INFORMATION_AND_CATALYSIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-49cb1621f5ba.js`; view `visualization-ec2bde042ea4.js` → `Visualization`.

#### Rod and cone visual sensitivity

Type `SENSORY_VISUAL_RODS_CONES_LIGHT_SENSITIVITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6afae062f026.js`; view `visualization-ea903528f329.js` → `Visualization`.

#### Root cross-section tissue systems

Flowering-plant root cross section showing root hairs and epidermis around the cortex, an endodermis surrounding central xylem, and phloem between the xylem arms

Type `PLANT_ROOT_CROSS_SECTION_TISSUE_SYSTEMS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1b82a77caf7f.js`; view `visualization-ed08fee06cf1.js` → `Visualization`.

#### Root gravitropism auxin reorientation

Type `ROOT_GRAVITROPISM_AUXIN_REORIENTATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-feeae5b7bea7.js`; view `visualization-3c7f754da436.js` → `Visualization`.

#### Root hydrotropism and moisture gradients

Type `ROOT_HYDROTROPISM_MOISTURE_GRADIENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ae71bdeade15.js`; view `visualization-3c9913b83e4d.js` → `Visualization`.

#### Root-hair mineral-ion uptake

Magnified root hair using an ATP-powered membrane pump to move a dissolved mineral ion from lower concentration in soil into higher concentration inside the root cell

Type `PLANT_ROOT_HAIR_MINERAL_ION_UPTAKE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cda463d5cfd9.js`; view `visualization-ad990f210a87.js` → `Visualization`.

#### Root-hair water absorption

Magnified root hair absorbing water from soil and carrying that same water through root tissue into xylem

Type `PLANT_ROOT_HAIR_WATER_ABSORPTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-118f50b240ca.js`; view `visualization-32a8ed61ddb6.js` → `Visualization`.

#### Rooted phylogenetic tree anatomy

Type `ROOTED_PHYLOGENETIC_TREE_ANATOMY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b5cb286d2ce2.js`; view `visualization-f98059cb00e1.js` → `Visualization`.

#### Rough versus smooth endoplasmic reticulum

Type `ROUGH_VERSUS_SMOOTH_ENDOPLASMIC_RETICULUM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-12cccf874cb5.js`; view `visualization-cdb0ba359972.js` → `Visualization`.

#### Saturating biological dose-response relationship

Type `BIOLOGICAL_DOSE_RESPONSE_AND_SATURATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a29ff7456296.js`; view `visualization-25d02fbe57f8.js` → `BiologicalDoseResponseAndSaturationVisualization`.

#### Seasonal food scarcity induces hibernation and reduced metabolism

Type `HIBERNATION_SEASONAL_ENERGY_CONSERVATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f30ca30c2a6d.js`; view `visualization-8d571d39a1e2.js` → `HibernationSeasonalEnergyConservationVisualization`.

#### Secondary active cotransport

Type `SECONDARY_ACTIVE_COTRANSPORT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fdaa35f99070.js`; view `visualization-1538fbf9144f.js` → `Visualization`.

#### Secondary succession ecosystem recovery

Type `SECONDARY_SUCCESSION_ECOSYSTEM_RECOVERY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-58e653f36fa9.js`; view `visualization-f6969245e234.js` → `SecondarySuccessionEcosystemRecoveryVisualization`.

#### Seed dispersal adaptations: wings and hooks

A parent flowering plant beside a winged seed carried in the direction of wind and a different hooked seed caught in animal fur, comparing two seed-dispersal adaptations

Type `PLANT_SEED_DISPERSAL_ADAPTATIONS` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-b6c0eab2709a.js`; view `visualization-ad6253b874c8.js` → `Visualization`.

#### Seed dispersal and the next generation

Seed dispersal: one seed leaves a mature parent plant, moves to a different location, and grows into a separate next-generation seedling.

Type `ORGANISM_SEED_DISPERSAL_AND_NEXT_GENERATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-558840ae4c86.js`; view `visualization-5317000b9daa.js` → `OrganismSeedDispersalAndNextGenerationVisualization`.

#### Seed germination and seedling growth

Seed germination: water activates a living seed, the root grows downward first, the shoot grows upward, and a rooted seedling develops leaves.

Type `ORGANISM_SEED_GERMINATION_AND_SEEDLING_GROWTH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-328a29e06d5b.js`; view `visualization-d7e064c9a93b.js` → `OrganismSeedGerminationAndSeedlingGrowthVisualization`.

#### Seed germination: root before shoot

One living seed taking up water, sending a radicle root downward first, then growing an upward shoot and first leaves

Type `PLANT_SEED_GERMINATION_ROOT_BEFORE_SHOOT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-cf3233c2081b.js`; view `visualization-1b6864bfe322.js` → `Visualization`.

#### Selective channel and carrier proteins

Type `MEMBRANE_CHANNEL_CARRIER_SPECIFICITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a215e928bcb4.js`; view `visualization-8849f1a3be44.js` → `Visualization`.

#### Selective permeability of the plasma membrane

Type `MEMBRANE_SELECTIVE_PERMEABILITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1ee3bc06b9f4.js`; view `visualization-4e4deee49301.js` → `Visualization`.

#### Semiconservative DNA replication

Type `DNA_REPLICATION_SEMICONSERVATIVE_INHERITANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-865ce1221646.js`; view `visualization-a8832a869d61.js` → `DnaReplicationSemiconservativeInheritanceVisualization`.

#### Sensory adaptation in phasic and tonic receptors

Type `SENSORY_ADAPTATION_PHASIC_TONIC_RECEPTORS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d74c69b35ab6.js`; view `visualization-59d9e9d82f3f.js` → `Visualization`.

#### Sensory population recruitment and stimulus intensity

Type `SENSORY_POPULATION_RECRUITMENT_INTENSITY_CODING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-44bde8bcd42d.js`; view `visualization-866362faa2ad.js` → `Visualization`.

#### Sensory receptor potential and firing threshold

Type `SENSORY_RECEPTOR_POTENTIAL_THRESHOLD` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-66bccf0a3d32.js`; view `visualization-f8fce689b4ff.js` → `Visualization`.

#### Sensory stimulus intensity frequency coding

Type `SENSORY_STIMULUS_INTENSITY_FREQUENCY_CODING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c00f95c080db.js`; view `visualization-bc459a7a01be.js` → `Visualization`.

#### Separate meiotic cells compare two equally likely independent-assortment orientations

Type `METAPHASE_ONE_INDEPENDENT_ASSORTMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e36233912456.js`; view `visualization-52afabfc3821.js` → `Visualization`.

#### Sequential colonization of land by life

Type `SEQUENTIAL_COLONIZATION_OF_LAND_BY_LIFE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-61c57c98ee7f.js`; view `visualization-aa76bd587506.js` → `SequentialColonizationOfLandByLifeVisualization`.

#### Sexual versus asexual animal reproduction

Sexual versus asexual animal reproduction: Some animals such as hydra reproduce asexually by budding from one parent, whereas sexual reproduction forms a zygote through the fusion of two gametes carrying distinguishable parental contributions.

Type `ANIMAL_SEXUAL_VERSUS_ASEXUAL_REPRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7a5959e73df1.js`; view `visualization-c9c8cccbb57c.js` → `AnimalSexualVersusAsexualReproductionVisualization`.

#### Shade avoidance red/far-red signaling

Type `SHADE_AVOIDANCE_RED_FAR_RED_SIGNALING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-41099eb227b7.js`; view `visualization-9af6bbaed86b.js` → `Visualization`.

#### Shape-dependent protein function is lost during denaturation

Type `PROTEIN_DENATURATION_UNFOLDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-531ada35ff78.js`; view `visualization-71efb34134b0.js` → `ProteinDenaturationUnfoldingVisualization`.

#### Shared derived character inheritance

Type `SHARED_DERIVED_CHARACTER_INHERITANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e04eaf16d16a.js`; view `visualization-5d9b4d894aa1.js` → `Visualization`.

#### Shared derived characters define nested clades

Type `SHARED_DERIVED_CHARACTER_CLADE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9577d13255f9.js`; view `visualization-d183499b3095.js` → `Visualization`.

#### Shared signal transduction can alter a cytoplasmic enzyme or nuclear gene expression

Cellular response comparison: one membrane receptor and shared intracellular relay branch toward a cytoplasmic enzyme-activity response or a nucleus-associated gene-expression response.

Type `SIGNAL_RESPONSE_GENE_EXPRESSION_VERSUS_ENZYME_ACTIVATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e3a99bb3880b.js`; view `visualization-575b9e5cb856.js` → `Visualization`.

#### Short-wavelength excitation causes longer-wavelength fluorescence

Type `MICROSCOPY_FLUORESCENCE_EXCITATION_EMISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-daa2567423cb.js`; view `visualization-341b935e599f.js` → `Visualization`.

#### Sigmoidal hemoglobin oxygen saturation at tissues and lungs

Hemoglobin oxygen dissociation curve: oxygen availability increases along the horizontal axis and hemoglobin saturation rises sigmoidally; the lower-oxygen tissue region is steep and supports unloading, while the high-oxygen lung region forms a high-saturation loading plateau.

Type `ANIMAL_HEMOGLOBIN_OXYGEN_DISSOCIATION_CURVE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-6de633b923d6.js`; view `visualization-e600f6779b9d.js` → `AnimalHemoglobinOxygenDissociationCurveVisualization`.

#### Silent missense and nonsense outcomes

Type `MUTATION_SUBSTITUTION_OUTCOMES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a914b2788b8b.js`; view `visualization-7d986f416c10.js` → `Visualization`.

#### Silent synonymous substitution

Type `MUTATION_SILENT_SUBSTITUTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-21952aa7c1c4.js`; view `visualization-955a317489c0.js` → `Visualization`.

#### Simple diffusion across a plasma membrane

Type `SIMPLE_DIFFUSION_ACROSS_MEMBRANE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1c85b0dfed0f.js`; view `visualization-a79d06266707.js` → `Visualization`.

#### Simple versus stratified epithelium

Type `EPITHELIAL_SIMPLE_VERSUS_STRATIFIED_BARRIERS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-96827e41dc93.js`; view `visualization-a40d40ac312b.js` → `EpithelialSimpleVersusStratifiedBarriersVisualization`.

#### Single-base substitution

Type `MUTATION_BASE_SUBSTITUTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-aad7ce449b9a.js`; view `visualization-d7b05e9df49a.js` → `Visualization`.

#### Sinoatrial initiation, atrioventricular delay, and ventricular conduction

Cardiac electrical-conduction animation: one impulse starts at the sinoatrial node, activates the atria, pauses at the atrioventricular node, and then splits through both ventricular conduction branches to coordinate ventricular contraction.

Type `ANIMAL_CARDIAC_ELECTRICAL_CONDUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ef881225bb1f.js`; view `visualization-16073b5b9b36.js` → `AnimalCardiacElectricalConductionVisualization`.

#### Sister taxa and their exclusive ancestor

Type `PHYLOGENETIC_SISTER_TAXA` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ec96b26e46c4.js`; view `visualization-80f663fc52fa.js` → `Visualization`.

#### Skeletal-muscle structural organization

Type `MUSCULOSKELETAL_SKELETAL_MUSCLE_ORGANIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-baed8a5b88f8.js`; view `visualization-a2abbe2d9fc4.js` → `MusculoskeletalSkeletalMuscleOrganizationVisualization`.

#### Skin and mucosal barrier defense

How can skin and mucus stop a pathogen before infection? Explain why intact epithelium, mucus trapping, and directed surface clearance prevent pathogens from reaching internal tissue.

Type `SKIN_MUCUS_PHYSICAL_CHEMICAL_BARRIERS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f00157b0e889.js`; view `visualization-1f9d7493bce8.js` → `SkinMucusPhysicalChemicalBarriersVisualization`.

#### Skin layers and accessory structures

Type `INTEGUMENT_SKIN_LAYERS_AND_ACCESSORY_STRUCTURES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9b37492c65f2.js`; view `visualization-aac1e2fa5171.js` → `IntegumentSkinLayersAndAccessoryStructuresVisualization`.

#### Small-scale DNA mutations

Type `MUTATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f22d40e897cf.js`; view `visualization-cd41513ba31c.js` → `Visualization`.

#### Smooth and folded membranes with the same projected cell width

Type `CELL_SIZE_MEMBRANE_FOLDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3cf3e2230e6f.js`; view `visualization-f174c607b488.js` → `CellSizeMembraneFoldingVisualization`.

#### Sodium-potassium pump active transport

Type `SODIUM_POTASSIUM_ACTIVE_TRANSPORT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-53c5621a933e.js`; view `visualization-f4186b6b3d0c.js` → `Visualization`.

#### Somatic versus autonomic motor pathways

A somatic motor neuron travels directly from the central nervous system to skeletal muscle, while an autonomic motor pathway uses two neurons joined in a peripheral ganglion.

Type `SOMATIC_VERSUS_AUTONOMIC_MOTOR_PATHWAYS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-504118e2c088.js`; view `visualization-9127d63fea73.js` → `SomaticVersusAutonomicMotorPathwaysVisualization`.

#### Somatotopic sensory cortical representation

Type `SENSORY_SOMATOTOPIC_CORTICAL_REPRESENTATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c53cdcd511d8.js`; view `visualization-d0bb6404e83d.js` → `Visualization`.

#### Specialized nerve, muscle, and secretory structures support different functions

Specialized cell structure and function: a neuron uses its long axon to signal, a muscle cell uses aligned fibers to contract, and a secretory cell exports protein-containing vesicles.

Type `SPECIALIZED_CELL_STRUCTURE_AND_FUNCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ad726e2626ee.js`; view `visualization-a3374070e7a5.js` → `Visualization`.

#### Sperm versus egg specialization

Sperm versus egg specialization: Animal sperm and eggs are both haploid gametes but differ in structure and role: sperm have a compact genetic head, energy-supporting midpiece, and motile flagellum, while the larger oocyte supplies a haploid nucleus, abundant cytoplasm, and resources for early development.

Type `ANIMAL_SPERM_VERSUS_EGG_SPECIALIZATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-2264e623055f.js`; view `visualization-816f5acd4178.js` → `AnimalSpermVersusEggSpecializationVisualization`.

#### Spermatogenesis versus oogenesis

Spermatogenesis versus oogenesis: Both spermatogenesis and oogenesis use meiosis to generate haploid cells. Spermatogenesis partitions cytoplasm relatively evenly among four functional sperm, whereas oogenesis retains most cytoplasm in one functional egg and partitions the remaining chromosome sets into small polar bodies; exact polar-body number can vary.

Type `ANIMAL_SPERMATOGENESIS_VERSUS_OOGENESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-486c524c8a25.js`; view `visualization-cc18645ff50f.js` → `AnimalSpermatogenesisVersusOogenesisVisualization`.

#### Spindle checkpoint requires bipolar attachment before anaphase

Type `SPINDLE_ASSEMBLY_CHECKPOINT_ATTACHMENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ac9239514bc7.js`; view `visualization-659f9667ff2b.js` → `Visualization`.

#### Sponge filter feeding

Type `ANIMAL_SPONGE_FILTER_FEEDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9013930a3d2c.js`; view `visualization-64d6e2405d96.js` → `AnimalSpongeFilterFeedingVisualization`.

#### Squamous, cuboidal, and columnar epithelial cells

Type `EPITHELIAL_SQUAMOUS_CUBOIDAL_COLUMNAR_CELL_SHAPES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dfd608ddf1e1.js`; view `visualization-18639ab9c5dc.js` → `EpithelialSquamousCuboidalColumnarCellShapesVisualization`.

#### Stable allele frequencies across generations

Type `POPULATION_GENETICS_EQUILIBRIUM_ACROSS_GENERATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7ccbb2803f74.js`; view `visualization-d3a424f4a2b7.js` → `Visualization`.

#### Stem vascular-bundle cross section

Flowering-plant stem cross section showing an outer epidermis, surrounding ground tissue, a central pith, and a ring of vascular bundles with xylem toward the center and phloem toward the outside

Type `PLANT_STEM_VASCULAR_BUNDLE_CROSS_SECTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bbfe8c75e571.js`; view `visualization-74f12de3719a.js` → `Visualization`.

#### Stem-cell differentiation: neuronal gene expression precedes specialized structure

Stem-cell differentiation: an unspecialized stem cell retains the same genome, activates neuronal gene expression, and then acquires specialized neuron structure.

Type `STEM_CELL_DIFFERENTIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-a029640dedb7.js`; view `visualization-f7d5b6b26a6f.js` → `Visualization`.

#### Stem-cell potency narrows from totipotent to a restricted neuronal lineage

Stem-cell potency and lineage restriction: totipotent cells can form all tissues, pluripotent cells retain multiple body-cell fates, and a multipotent neuronal progenitor produces its related neuronal lineage while preserving the same genome.

Type `STEM_CELL_POTENCY_AND_LINEAGE_RESTRICTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7dcb52ef948e.js`; view `visualization-6a4c21262fbe.js` → `Visualization`.

#### Stored fossil carbon, human combustion, and atmospheric accumulation

Why does releasing long-stored fossil carbon increase atmospheric carbon dioxide? Predict that rapid transfer of carbon from long-term geological storage to the atmosphere increases atmospheric carbon dioxide when removal does not keep pace.

Type `BIOGEOCHEMICAL_CARBON_FOSSIL_FUEL_IMBALANCE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-96d9ff82458b.js`; view `visualization-893b90cbd2d5.js` → `Visualization`.

#### Stored seed food supports growth until first true leaves develop

Seed food reserves: stored food is visibly depleted while the first root and upward shoot grow, then the first true leaves use sunlight to begin making new food.

Type `ORGANISM_SEED_RESERVES_TO_FIRST_LEAVES` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-525177d04c19.js`; view `visualization-7a1a1dbfafee.js` → `OrganismSeedReservesToFirstLeavesVisualization`.

#### Substrate concentration raises enzyme activity until active sites saturate

Type `ENZYME_SUBSTRATE_SATURATION_KINETICS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-191de9d49e6a.js`; view `visualization-7c80a8230584.js` → `Visualization`.

#### Sugar-phosphate backbone

A nucleic-acid strand runs from its 5-prime end to its 3-prime end through repeating sugars and phosphates, while the attached A, G, T, and C bases carry sequence information.

Type `SUGAR_PHOSPHATE_BACKBONE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1ca029de8929.js`; view `visualization-534ca1c0d03c.js` → `Visualization`.

#### Sulfhydryl groups forming a disulfide bond

Type `BIOLOGICAL_SULFHYDRYL_DISULFIDE_BOND_FORMATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-bd6cdbdaf26f.js`; view `visualization-2a5739e992d9.js` → `Visualization`.

#### Sunlight energy travels through food to animal activity and heat

Sunlight energy enters a plant, travels in plant-made food to an animal, and emerges as usable energy and heat while food matter remains distinct.

Type `SUNLIGHT_FOOD_ENERGY_AND_HEAT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-eac0a546ddd0.js`; view `visualization-99d58580eb3f.js` → `Visualization`.

#### Superficial skin regeneration versus deeper collagen scarring

Type `SKIN_SUPERFICIAL_REGENERATION_VERSUS_DEEP_SCAR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-85dba1f309e2.js`; view `visualization-c302c80df199.js` → `SkinSuperficialRegenerationVersusDeepScarVisualization`.

#### sustainable-fisheries-harvest-population-recovery

Type `SUSTAINABLE_FISHERIES_HARVEST_POPULATION_RECOVERY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1776f8d89e90.js`; view `visualization-3d70c96306a7.js` → `SustainableFisheriesHarvestPopulationRecoveryVisualization`.

#### Sweat and sebaceous glands use different secretion routes

Type `INTEGUMENT_SWEAT_VERSUS_SEBACEOUS_GLAND_SECRETION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3b01ed20948d.js`; view `visualization-b83f64539baa.js` → `IntegumentSweatVersusSebaceousGlandSecretionVisualization`.

#### Sweating and evaporative cooling

Type `SKIN_SWEAT_EVAPORATION_COOLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-da74e4fc3144.js`; view `visualization-9a9b47c95e96.js` → `SkinSweatEvaporationCoolingVisualization`.

#### Symbiosis outcome comparison

Type `SYMBIOSIS_OUTCOME_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fccea7da84e7.js`; view `visualization-e5845358b2a0.js` → `SymbiosisOutcomeComparisonVisualization`.

#### Sympathetic adrenal medulla response

Type `SYMPATHETIC_ADRENAL_MEDULLA_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4ad7a58993ce.js`; view `visualization-47c84512e84f.js` → `Visualization`.

#### Synovial-joint structure

Type `MUSCULOSKELETAL_SYNOVIAL_JOINT_CARTILAGE_AND_FLUID` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-24211dc7b30e.js`; view `visualization-3d81cfa832ea.js` → `MusculoskeletalSynovialJointCartilageAndFluidVisualization`.

#### Systemic blood pressure falls most steeply across resistance arterioles

Systemic blood-pressure gradient: a connected route leads from the heart through an artery, narrow resistance arteriole, capillary, and vein; pressure starts high in the artery, drops most steeply across the arteriole, and remains low through capillaries and veins.

Type `ANIMAL_SYSTEMIC_BLOOD_PRESSURE_GRADIENT` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-73b3d9f0adfb.js`; view `visualization-4a9c51eb97bc.js` → `AnimalSystemicBloodPressureGradientVisualization`.

#### Systemic capillary exchange at body tissues

Animated systemic capillary exchange: oxygen-rich blood brings oxygen and absorbed food nutrients to a body cell, carbon dioxide produced by the cell returns into the blood, and the same blood becomes oxygen-poor at the tissue.

Type `ANIMAL_SYSTEMIC_CAPILLARY_TISSUE_EXCHANGE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ecf6f560f3a3.js`; view `visualization-55a6c24f8046.js` → `AnimalSystemicCapillaryTissueExchangeVisualization`.

#### Temporal versus spatial summation

Temporal summation combines closely repeated inputs from one synapse, while spatial summation combines simultaneous inputs from separate synapses; both can reach neuronal firing threshold.

Type `TEMPORAL_VERSUS_SPATIAL_SUMMATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-17ac95f695ab.js`; view `visualization-ecf1efdcc945.js` → `TemporalVersusSpatialSummationVisualization`.

#### Ten and twenty percent recombination correspond to unequal linked chromosome intervals

Type `LINKAGE_DISTANCE_AND_RECOMBINATION_FREQUENCY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5c06b35a88e6.js`; view `visualization-466dd5d775ea.js` → `LinkageDistanceAndRecombinationFrequencyVisualization`.

#### Tendril thigmotropism and touch coiling

Type `TENDRIL_THIGMOTROPISM_TOUCH_COILING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-581b22ad7267.js`; view `visualization-35808cd5588b.js` → `Visualization`.

#### The same DNA sequence is compared in tightly packed inaccessible chromatin and open accessible chromatin with RNA polymerase and transcript output.

Type `CHROMATIN_ACCESSIBILITY_GENE_EXPRESSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e6bc5423dc0f.js`; view `visualization-b9e72623e1ec.js` → `Visualization`.

#### The same food and oxygen atoms rearrange as separate energy is released

The same carbon, hydrogen, and oxygen atoms in food and oxygen regroup as carbon dioxide and water while energy is released separately.

Type `MATTER_IS_REARRANGED_ENERGY_IS_RELEASED` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d646e6416600.js`; view `visualization-a5442c467b13.js` → `Visualization`.

#### The same neuronal gene is accessible in a neuron and compact in a muscle cell

Cell-specific chromatin accessibility: the same neuronal gene is open and transcribed in a nerve cell but compact and comparatively silent in a muscle cell.

Type `CHROMATIN_ACCESSIBILITY_AND_CELL_IDENTITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5db16323776f.js`; view `visualization-d7653058e018.js` → `Visualization`.

#### The same received signal activates different intracellular pathways in two target cells

Pathway-specific cell responses: two target cells bind the same extracellular signal, but different intracellular signaling proteins produce enzyme activation in one cell and gene expression in the other.

Type `PATHWAY_SPECIFIC_CELL_RESPONSES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-76490f668ce8.js`; view `visualization-daa503fb4214.js` → `Visualization`.

#### Three additive genes create seven dosage classes and a symmetric 1:6:15:20:15:6:1 distribution

Type `POLYGENIC_INHERITANCE_CONTINUOUS_VARIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-86cd0157a229.js`; view `visualization-c45889156b67.js` → `PolygenicInheritanceContinuousVariationVisualization`.

#### Three AP Biology amino-acid R-group categories

Type `AMINO_ACID_SIDE_CHAIN_PROPERTIES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-8d32179b3852.js`; view `visualization-47e5d0b8a00b.js` → `AminoAcidSideChainPropertiesVisualization`.

#### Three domains and common ancestry

Type `LIFE_THREE_DOMAINS_AND_COMMON_ANCESTOR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-83c27ef11d12.js`; view `visualization-d25b422b6b6d.js` → `Visualization`.

#### Three generations of connected autosomal dominant Aa-to-child transmission

Type `MENDELIAN_AUTOSOMAL_DOMINANT_PEDIGREE_TRANSMISSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9dcc2e8e146d.js`; view `visualization-ba77697a006d.js` → `Visualization`.

#### Three levels of biodiversity

Type `BIODIVERSITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-fc8da6ee3c53.js`; view `visualization-85291fb4f61b.js` → `Visualization`.

#### Three ordered protein kinases use separate ATP phosphates and reversible phosphatase activity

Phosphorylation cascade architecture: an activated receptor feeds three ordered protein kinases, each phosphorylation uses a separate ATP-derived phosphate, a phosphatase removes phosphate, and the final kinase activates a response.

Type `PHOSPHORYLATION_CASCADE_ARCHITECTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-72787eb264c0.js`; view `visualization-51a8bb893ef4.js` → `Visualization`.

#### Three population-level ABO alleles and four two-allele blood phenotypes

Type `ABO_MULTIPLE_ALLELES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f3b8a5dd0737.js`; view `visualization-bf73fa2e7ec5.js` → `AboMultipleAllelesVisualization`.

#### Three separate ATP-derived phosphates sequentially activate a protein-kinase cascade

Phosphorylation cascade animation: three separate ATP-derived phosphates activate three protein kinases one after another, and the last activated kinase turns on the downstream response.

Type `PHOSPHORYLATION_CASCADE_ACTIVATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4ccd6d7b7174.js`; view `visualization-f5f859b928b7.js` → `Visualization`.

#### Three-prime poly-A tail addition

Type `THREE_PRIME_POLY_A_TAIL_ADDITION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b41904e68997.js`; view `visualization-49256b055f9f.js` → `Visualization`.

#### Tight junction blocks the route between adjacent animal cells

One extracellular molecule approaches the space between neighboring animal cells and stops at a tight-junction seal that blocks the paracellular route.

Type `TIGHT_JUNCTION_BARRIER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-4bf6420bb5b4.js`; view `visualization-d058b72f300a.js` → `Visualization`.

#### Tight-junction epithelial barrier

Type `EPITHELIAL_TIGHT_JUNCTION_SELECTIVE_BARRIER` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b152dcc3c867.js`; view `visualization-67170c7e43f4.js` → `EpithelialTightJunctionSelectiveBarrierVisualization`.

#### Tip order versus evolutionary relatedness

Type `PHYLOGENETIC_TIP_ORDER_MISCONCEPTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-dd16ce5a35d7.js`; view `visualization-dda54184f40c.js` → `Visualization`.

#### Tissue fluid, lymph-node immunity, and venous return

Lymphatic fluid-return animation: fluid leaves a blood capillary for body tissue, enters a blind-ended one-way lymph vessel, passes a white blood cell inside a lymph node, and returns through a lymphatic duct into systemic venous blood.

Type `ANIMAL_LYMPHATIC_FLUID_RETURN_AND_IMMUNITY` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-851682e94321.js`; view `visualization-f45b6388c481.js` → `AnimalLymphaticFluidReturnAndImmunityVisualization`.

#### Total microscope magnification

Type `MICROSCOPY_OBJECTIVE_EYEPIECE_TOTAL_MAGNIFICATION` · manifest v2 · animated thumbnail · not in the type enum.

Source: manifest `type-73bc95687614.js`; view `visualization-fbb81d60ea08.js` → `Visualization`.

#### Tracing a most recent common ancestor

Type `PHYLOGENETIC_COMMON_ANCESTOR_TRACING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-1f8990b5904a.js`; view `visualization-fed108ee866f.js` → `Visualization`.

#### Transcription and RNA processing

Type `TRANSCRIPTION_AND_RNA_PROCESSING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7a6838122995.js`; view `visualization-b729b05954c4.js` → `Visualization`.

#### Transcription elongation and RNA synthesis

Type `TRANSCRIPTION_ELONGATION_RNA_SYNTHESIS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ac3675c15171.js`; view `visualization-ef4e6194727f.js` → `Visualization`.

#### Transcription termination and RNA release

Type `TRANSCRIPTION_TERMINATION_RNA_RELEASE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-caaa65c169e6.js`; view `visualization-e9bf8063a2d0.js` → `Visualization`.

#### Transcription unit promoter and terminator

Type `TRANSCRIPTION_UNIT_PROMOTER_TERMINATOR` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d11021362679.js`; view `visualization-567875f67b03.js` → `Visualization`.

#### Translation elongation: A-site entry, peptide transfer, translocation

Type `TRANSLATION_ELONGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-336e52c18ea4.js`; view `visualization-7750d0397efb.js` → `TranslationElongationVisualization`.

#### Translation initiation: AUG, initiator methionine, and P site

Type `TRANSLATION_INITIATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b956405a451b.js`; view `visualization-9e7f8af35496.js` → `TranslationInitiationVisualization`.

#### Translation termination: UAA, release factor, and released peptide

Type `TRANSLATION_TERMINATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-10ad0f646a17.js`; view `visualization-b95f80d61479.js` → `TranslationTerminationVisualization`.

#### Translation: mRNA, ribosome, tRNA, and polypeptide

Type `TRANSLATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-7d1063d05668.js`; view `visualization-7ebf41b68584.js` → `TranslationVisualization`.

#### Transmission electron microscopy versus scanning electron microscopy

Type `MICROSCOPY_TEM_VERSUS_SEM_IMAGING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-44ea58ea7d6f.js`; view `visualization-e5fef0e025af.js` → `Visualization`.

#### Transpiration pull and cohesive xylem water

Water evaporates from a leaf, and a connected column of water molecules moves upward through the same xylem vessel toward the leaf

Type `PLANT_XYLEM_TRANSPIRATION_COHESION_PULL` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b52ed19f6540.js`; view `visualization-e3a7fad0d6d8.js` → `Visualization`.

#### Triglyceride structure

Type `TRIGLYCERIDE_STRUCTURE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d48e755453d9.js`; view `visualization-b4fe4ff99f5d.js` → `TriglycerideStructureVisualization`.

#### Trophic transfer efficiency and heat loss

Type `TROPHIC_TRANSFER_EFFICIENCY_AND_HEAT_LOSS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f26d8b834324.js`; view `visualization-39a883d2184a.js` → `Visualization`.

#### Two copies of the same regulatory sequence compare weak transcription with one activator against stronger expression when the full transcription-factor combination binds.

Type `TRANSCRIPTION_FACTOR_COMBINATORIAL_CONTROL` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9bb95b49538f.js`; view `visualization-e2b74f05a989.js` → `Visualization`.

#### Two independently assorting chromosome pairs produce four possible haploid parental-origin combinations across meioses

Type `GAMETE_CHROMOSOME_COMBINATION_DIVERSITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-ed582bc170d9.js`; view `visualization-6040875c01e4.js` → `Visualization`.

#### Two independently oriented homologous pairs segregate into complementary mixed-origin cells

Type `INDEPENDENT_ASSORTMENT_CHROMOSOME_SEGREGATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9e2e4f96d5df.js`; view `visualization-3cb0f8c41ecc.js` → `Visualization`.

#### Two recognizable eukaryotic cells retain the same genome while different regulatory states activate different genes and produce different proteins.

Type `CELL_TYPE_SPECIFIC_GENE_EXPRESSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9b624db869d2.js`; view `visualization-2fcd1589a5e6.js` → `Visualization`.

#### Type I, II, and III ecological survivorship curves

Type `POPULATION_ECOLOGY_SURVIVORSHIP_CURVES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-faa491a1c84a.js`; view `visualization-5dd67bed2cdb.js` → `Visualization`.

#### Undirected isopod kinesis and favorable-habitat retention

Type `KINESIS_ENVIRONMENTAL_ACCUMULATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-db92c466be6e.js`; view `visualization-cc5972dc527e.js` → `KinesisEnvironmentalAccumulationVisualization`.

#### Unscaled branch length versus relatedness

Type `PHYLOGENETIC_BRANCH_LENGTH_MISCONCEPTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5b89cbee5ff6.js`; view `visualization-7cf291e2bac6.js` → `Visualization`.

#### Vaccine-induced immune memory

How can a vaccine prepare a faster response without requiring the disease? Explain how exposure to a vaccine antigen establishes antigen-specific adaptive memory that supports a faster response to later encounter with the matching pathogen.

Type `VACCINE_INDUCED_IMMUNE_MEMORY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d5f1f871ded8.js`; view `visualization-b62cf1cc9cb4.js` → `VaccineInducedImmuneMemoryVisualization`.

#### Vertebrate diversity and adaptations

Type `VERTEBRATE_DIVERSITY_AND_ADAPTATIONS` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-79df90570682.js`; view `visualization-d183a5fa7bf5.js` → `Visualization`.

#### Vertebrate shared derived innovation cladogram

Type `VERTEBRATE_SHARED_DERIVED_INNOVATION_CLADOGRAM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-18c1051b36a2.js`; view `visualization-d1018950da5f.js` → `Visualization`.

#### Vertebrate skin and reproduction on land

Type `VERTEBRATE_SKIN_AND_REPRODUCTION_ON_LAND` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-59d01fc89060.js`; view `visualization-43f636f11449.js` → `Visualization`.

#### Vestibular rotation and hair-cell signaling

Type `SENSORY_VESTIBULAR_ROTATION_HAIR_CELL_SIGNALING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5101f91c02b7.js`; view `visualization-10245d651bc8.js` → `Visualization`.

#### Viruses and prokaryotes

Type `VIRUSES_AND_PROKARYOTES` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-88107789d63f.js`; view `visualization-3509d583e8d3.js` → `VirusesAndProkaryotesVisualization`.

#### Visual sensory pathway from retina to cortex

Type `SENSORY_VISUAL_RETINA_CORTEX_PATHWAY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d2beaf09ff5a.js`; view `visualization-62b45f1b5f65.js` → `Visualization`.

#### Water adhesion and capillary rise

Type `WATER_ADHESION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-b98b5f150a4c.js`; view `visualization-4f52024ca5b6.js` → `Visualization`.

#### Water autoionization, hydronium, and hydroxide

Type `BIOLOGICAL_WATER_AUTOIONIZATION_HYDRONIUM_HYDROXIDE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-978d8b153dc0.js`; view `visualization-d88bf7cd57ca.js` → `Visualization`.

#### Water high heat of vaporization and evaporative cooling

Type `WATER_EVAPORATIVE_COOLING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-10560b6b1e94.js`; view `visualization-f18d4b839531.js` → `Visualization`.

#### Water infiltration, groundwater movement, and surface discharge

How can precipitation return to surface water through groundwater? Trace one conserved water marker through precipitation, infiltration, connected soil pore spaces, groundwater movement, and discharge into surface water.

Type `BIOGEOCHEMICAL_WATER_INFILTRATION_AND_GROUNDWATER_RETURN` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-34fa4d2188aa.js`; view `visualization-93be519afdbf.js` → `Visualization`.

#### Water molecule polarity

Type `WATER_MOLECULE_POLARITY` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3f98a719cdac.js`; view `visualization-ea541b32167b.js` → `Visualization`.

#### Water phase changes and return pathways

How can one water molecule evaporate, condense, precipitate, and return to surface water? Trace the same water through evaporation, condensation, precipitation, and surface runoff while distinguishing movement between reservoirs from changes of state.

Type `BIOGEOCHEMICAL_WATER_PHASE_CHANGE_AND_RETURN` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-55b70b78423f.js`; view `visualization-28269b310833.js` → `Visualization`.

#### Water structure and hydrogen bonding

Type `STRUCTURE_OF_WATER_HYDROGEN_BONDING` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-30b271c923a2.js`; view `visualization-25259857744c.js` → `Visualization`.

#### Water surface tension

Type `WATER_SURFACE_TENSION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-900de7db375d.js`; view `visualization-c8a7a339a2eb.js` → `Visualization`.

#### Water-soluble surface receptors versus lipid-soluble internal receptors

A water-soluble signal stays outside and binds a surface receptor, while a lipid-soluble signal crosses the membrane to bind an intracellular receptor.

Type `CELL_RECEPTOR_LOCATION_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-44959a606b0f.js`; view `visualization-c56acd91cf44.js` → `CellReceptorLocationComparisonVisualization`.

#### When lactose is already present and glucose falls, cAMP binds CAP, the CAP–cAMP complex recruits RNA polymerase, and lac transcription increases.

Type `LAC_OPERON_CATABOLITE_ACTIVATION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-c7643a3d5e8b.js`; view `visualization-599cf742ade3.js` → `Visualization`.

#### Whole-organism cooling restores temperature toward a set point

Type `PHYSIOLOGICAL_THERMOREGULATION_NEGATIVE_FEEDBACK` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-d71d53aba559.js`; view `visualization-6325efd3ebf8.js` → `PhysiologicalThermoregulationNegativeFeedbackVisualization`.

#### Why a whale is a mammal, not a fish

Type `VERTEBRATE_WHALE_MAMMAL_NOT_FISH` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-3ccbde9870dd.js`; view `visualization-c4d19b704153.js` → `Visualization`.

#### Why small cells exchange materials efficiently

Type `CELL_SIZE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-5573d3c7efeb.js`; view `visualization-af463728e59f.js` → `CellSizeVisualization`.

#### Withdrawal-reflex sensory and motor response

A painful hand stimulus travels along a sensory neuron into the spinal cord. A spinal interneuron activates a motor neuron, skeletal muscle contracts, and the same hand withdraws before conscious brain processing is needed.

Type `WITHDRAWAL_REFLEX_SENSORY_MOTOR_RESPONSE` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-e55422374e65.js`; view `visualization-edb6b92d51bf.js` → `WithdrawalReflexSensoryMotorResponseVisualization`.

#### Xylem and phloem transport comparison

One flowering plant comparing upward xylem water transport from roots with phloem sugar movement from a source leaf toward both shoot and root sinks

Type `PLANT_XYLEM_PHLOEM_TRANSPORT_COMPARISON` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-9fa238b86f42.js`; view `visualization-fca3c19f69dc.js` → `Visualization`.

#### Xylem water and transpiration stream

One continuous water marker moving from roots upward through stem xylem to a leaf and leaving as transpired water vapor

Type `PLANT_XYLEM_WATER_TRANSPIRATION_STREAM` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-f380070a883b.js`; view `visualization-c2ba1cb5f83f.js` → `Visualization`.

#### Yeast budding reproduction

Type `YEAST_BUDDING_REPRODUCTION` · manifest v1 · animated thumbnail · not in the type enum.

Source: manifest `type-76a5aa97f57d.js`; view `visualization-420745178b50.js` → `Visualization`.

### SVG and HTML (808)

#### Abo rh blood typing

Type `ABO_RH_BLOOD_TYPING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f01c4d0d1c86.js` → `AboRhBloodTypingVisualization`.

#### Abo rh transfusion compatibility

Type `ABO_RH_TRANSFUSION_COMPATIBILITY` · manifest v1.

Parameters: `donorType` (enum, default `A+`, one of `O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`); `recipientType` (enum, default `B-`, one of `O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`).

Source: manifest `type-99cca3d49ce0.js`; view `visualization-f0fc1dbecc69.js` → `AboRhTransfusionVisualization`.

#### Absorbance spectrum

Measurement wavelength

Type `ABSORBANCE_SPECTRUM` · manifest v4.

Parameters: `lambda_max_nm` (number, default `520`, range 210 to 740).

Source: manifest `type-dfeec9c7c75e.js`; view `visualization-818898a3bfb4.js` → `Visualization`.

#### Absorption variable costing inventory profit: `\mathrm{OI}_{A}-\mathrm{OI}_{V}=\Delta I\times \mathrm{FOH}_{u}`

Type `ABSORPTION_VARIABLE_COSTING_INVENTORY_PROFIT` · manifest v3 · formula `\mathrm{OI}_{A}-\mathrm{OI}_{V}=\Delta I\times \mathrm{FOH}_{u}`.

Parameters: `unitsProduced` (integer, default `800`, range 100 to 10000); `unitsSold` (integer, default `600`, range 100 to 10000).

Source: manifest `type-796063db4408.js`; view `visualization-fcbd0d16e145.js` → `AbsorptionVariableCostingVisualization`.

#### Accrual vs cash accounting

Type `ACCRUAL_VS_CASH_ACCOUNTING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1d9b5e6c9b0f.js` → `AccrualVsCashAccountingVisualization`.

#### Accuracy vs precision targets

Average position relative to the reference value

Type `ACCURACY_VS_PRECISION_TARGETS` · manifest v1.

Parameters: `meanPosition` (enum, default `centered`, one of `centered`, `offset`); `measurementSpread` (enum, default `small`, one of `small`, `large`).

Source: manifest `type-c3de85d12da6.js`; view `visualization-9829e93353a9.js` → `AccuracyPrecisionVisualization`.

#### Acid base proton transfer

Reaction example

Type `ACID_BASE_PROTON_TRANSFER` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8438f0926fe9.js` → `Visualization`.

#### Acid base speciation

Diprotic-acid fractional-distribution plot from pH 0 to 14, with pKa1 {pKa1} and pKa2 {pKa2}. At pH {pH}, H2A is {h2a}, HA minus is {ha}, and A two-minus is {a}; {takeaway}.

Type `ACID_BASE_SPECIATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a7fae2d40314.js` → `AcidBaseSpeciationVisualization`.

#### Acid base titration

Type `ACID_BASE_TITRATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-2e86b9cfe34f.js` → `AcidBaseTitrationVisualization`.

#### Acid deposition

Acid-deposition pathway stage

Type `ACID_DEPOSITION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a6ce05d6e4b4.js` → `Visualization`.

#### Acid strength and conjugate base stability

Acidity comparison

Type `ACID_STRENGTH_AND_CONJUGATE_BASE_STABILITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-344497562408.js` → `Visualization`.

#### Action potential neuron

Action potential stage

Type `ACTION_POTENTIAL_NEURON` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-676a7cad51cc.js` → `Visualization`.

#### Action potential nodes

Action potential position

Type `ACTION_POTENTIAL_NODES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-394cce444c3f.js` → `ActionPotentialNodesVisualization`.

#### Action potential voltage

Type `ACTION_POTENTIAL_VOLTAGE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-cbacd54e61c0.js` → `ActionPotentialVoltageVisualization`.

#### Activation energy distribution

Temperature in kelvin

Type `ACTIVATION_ENERGY_DISTRIBUTION` · manifest v4.

Parameters: `initial_temperature_k` (number, default `600`, range 300 to 900); `activation_energy_kj_mol` (number, default `16`, range 8 to 28).

Source: manifest `type-a73db772b207.js`; view `visualization-528696af2c1e.js` → `ActivationEnergyDistributionVisualization`.

#### Active vs passive immunity

Type `ACTIVE_VS_PASSIVE_IMMUNITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a7122b04fa29.js` → `Visualization`.

#### Acute inflammation

Acute inflammation stage

Type `ACUTE_INFLAMMATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8af27e8441e8.js` → `AcuteInflammationVisualization`.

#### Acute triangle

Type `ACUTE_TRIANGLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1a84125140e4.js` → `AcuteTriangleVisualization`.

#### Add fractions

Type `ADD_FRACTIONS` · manifest v4.

Parameters: `firstNumerator` (integer, default `1`, range 1 to 4); `firstDenominator` (integer, default `3`, range 2 to 6); `secondNumerator` (integer, default `3`, range 1 to 4); `secondDenominator` (integer, default `6`, range 2 to 6).

Source: manifest `type-4b5ff0bb4ae8.js`; view `visualization-7e5aee2f5834.js` → `AddFractionsVisualization`.

#### Adding integers

Type `ADDING_INTEGERS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1507bc3ab0a3.js` → `AddingIntegersVisualization`.

#### Adding negative integer

Type `ADDING_NEGATIVE_INTEGER` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-eb8bdd7ca67e.js` → `AddingNegativeIntegerVisualization`.

#### Adsr envelope

ADSR parameter

Type `ADSR_ENVELOPE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-cd24dea94a2f.js` → `AdsrEnvelopeVisualization`.

#### Age structure pyramid

Age-structure pattern

Type `AGE_STRUCTURE_PYRAMID` · manifest v4.

Parameters: `initial_pattern` (enum, default `expansive`, one of `expansive`, `stationary`, `constrictive`).

Source: manifest `type-19661ffd37c1.js`; view `visualization-b648b7e2421d.js` → `Visualization`.

#### Aggregate demand

Type `AGGREGATE_DEMAND` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-47261ba0bd99.js` → `AggregateDemandVisualization`.

#### Aggregate demand and supply

Aggregate demand position

Type `AGGREGATE_DEMAND_AND_SUPPLY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-bb6c9f5f61d1.js` → `AdAsEquilibriumVisualization`.

#### Agricultural soil erosion

Erosion stage

Type `AGRICULTURAL_SOIL_EROSION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b6f0e1d50783.js` → `Visualization`.

#### Alcohol oxidation products

Type `ALCOHOL_OXIDATION_PRODUCTS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f384c0966011.js` → `AlcoholOxidationProductsVisualization`.

#### Alkene e z stereochemistry

Type `ALKENE_E_Z_STEREOCHEMISTRY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-335d6f4adb35.js` → `Visualization`.

#### Alkene stereochemical additions

Addition pathway

Type `ALKENE_STEREOCHEMICAL_ADDITIONS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-9faf106e0d23.js` → `Visualization`.

#### Alveolar gas exchange

Gas to emphasize

Type `ALVEOLAR_GAS_EXCHANGE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-cf163446f97e.js` → `AlveolarGasExchangeVisualization`.

#### Amino acids and peptide bonds

Amino-acid pair

Type `AMINO_ACIDS_AND_PEPTIDE_BONDS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-327017a12d9d.js` → `Visualization`.

#### Angular frequency relation: `\omega = 2\pi f`

Type `ANGULAR_FREQUENCY_RELATION` · manifest v3 · formula `\omega = 2\pi f`, also `\omega = \frac{2\pi}{T}`, `\omega = \frac{d\theta}{dt}`, `\omega = \sqrt{\frac{k}{m}}`, `\omega = \sqrt{k/m}`, `\omega^2 = \frac{k}{m}`, `f = \frac{\omega}{2\pi}`, `T = \frac{2\pi}{\omega}`, `\omega = 2\pi f = \frac{2\pi}{T}`, `(\omega = 2\pi f)`, `2\pi f = \omega`, `w=2pif`, `omega=2pif`, `2pif=omega`, `2pif=w`, `omega = 2 pi f`, `w=2pi/t`, `omega=2pi/t`, `f=w/2pi`, `f=omega/2pi`, `w=dtheta/dt`, `omega=dtheta/dt`, `w=sqrt(k/m)`, `omega=sqrt(k/m)`, `w^2=k/m`, `omega^2=k/m`.

Parameters: `frequency` (number, default `1.5`, range 0.01 to 1000).

Source: manifest `type-dd26222ad182.js`; view `visualization-9333cf228538.js` → `AngularFrequencyRelationVisualization`.

#### Animal life cycle

Animal

Type `ANIMAL_LIFE_CYCLE` · manifest v2.

Parameters: `animal` (enum, default `butterfly`, one of `butterfly`, `frog`, `chicken`, `mammal`).

Source: manifest `type-11d77b78e3d4.js`; view `visualization-e72244bb955b.js` → `AnimalLifeCycleVisualization`.

#### Anova decomposition

Data view

Type `ANOVA_DECOMPOSITION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c2d17a4b6c18.js` → `AnovaDecompositionVisualization`.

#### Anova interaction plot

Choose an interaction pattern

Type `ANOVA_INTERACTION_PLOT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c7a3e6250990.js` → `Visualization`.

#### Antibiotic resistance

Antibiotic resistance stage

Type `ANTIBIOTIC_RESISTANCE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-9d958facb6e0.js` → `Visualization`.

#### Antibody structure

Type `ANTIBODY_STRUCTURE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-52377431fc2a.js` → `Visualization`.

#### Apoptosis

Initiating signal

Type `APOPTOSIS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f0410ebea62b.js` → `Visualization`.

#### Aquifer and groundwater

Type `AQUIFER_AND_GROUNDWATER` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d269e5fb4dee.js` → `Visualization`.

#### Arc length

Arc-length proof step

Type `ARC_LENGTH` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-271e6540097a.js` → `ArcLengthVisualization`.

#### Arithmetic mean

Value {number}

Type `ARITHMETIC_MEAN` · manifest v3.

Parameters: `observation1` (integer, default `2`, range 1 to 10); `observation2` (integer, default `4`, range 1 to 10); `observation3` (integer, default `7`, range 1 to 10).

Source: manifest `type-501bb4244183.js`; view `visualization-7caebdd5de43.js` → `ArithmeticMeanVisualization`.

#### Arithmetic sequence

Type `ARITHMETIC_SEQUENCE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4c404c2be44a.js` → `ArithmeticSequenceVisualization`.

#### Arithmetic sequence sum formula

Type `ARITHMETIC_SEQUENCE_SUM_FORMULA` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c056eae7d2bd.js` → `ArithmeticSequenceSumVisualization`.

#### Arithmetic vs geometric

Type `ARITHMETIC_VS_GEOMETRIC` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-95290b600eaf.js` → `ArithmeticVsGeometricVisualization`.

#### Aromaticity and huckels rule

Cyclic species

Type `AROMATICITY_AND_HUCKELS_RULE` · manifest v1.

Parameters: `initial_example` (enum, default `benzene`, one of `benzene`, `cyclobutadiene`, `cyclooctatetraene`, `cyclopentadienyl-anion`, `cyclopropenyl-cation`).

Source: manifest `type-4644d5bf838d.js`; view `visualization-8ba13bf06edc.js` → `Visualization`.

#### Array queue front rear

Queue mode

Type `ARRAY_QUEUE_FRONT_REAR` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-46593c3d8626.js` → `ArrayQueueFrontRearVisualization`.

#### Asymmetric key roles

Choose the security goal

Type `ASYMMETRIC_KEY_ROLES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4261a2e635a1.js` → `AsymmetricKeyRolesVisualization`.

#### Atherosclerosis

Atherosclerosis stage

Type `ATHEROSCLEROSIS` · manifest v4.

Parameters: `initial_stage` (enum, default `established plaque`, one of `healthy artery`, `fatty streak`, `established plaque`, `plaque rupture and thrombus`).

Source: manifest `type-c62486043386.js`; view `visualization-41e6ebeef86f.js` → `AtherosclerosisVisualization`.

#### Atmospheric layers

Atmospheric temperature profile. At {altitudeCount, plural, one {{altitude} kilometer} other {{altitude} kilometers}}, the selected point is in the {layer}; temperature generally {trend} with further ascent. The nearest boundary is the {boundary} near {boundaryAltitudeCount, plural, one {{boundaryAltitude} kilometer} other {{boundaryAltitude} kilometers}}.

Type `ATMOSPHERIC_LAYERS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-526c20dc215d.js` → `AtmosphericLayersVisualization`.

#### Atmospheric pollution plume

Atmospheric stability regime

Type `ATMOSPHERIC_POLLUTION_PLUME` · manifest v4.

Parameters: `initial_plume_regime` (enum, default `looping`, one of `looping`, `coning`, `fanning`, `lofting`, `fumigation`, `trapping`).

Source: manifest `type-b367cfc0fc69.js`; view `visualization-d53ea466bcbd.js` → `Visualization`.

#### Atomic composition

Type `ATOMIC_COMPOSITION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e4406b1e132b.js` → `AtomicCompositionVisualization`.

#### Atp cycle

ATP cycle phase

Type `ATP_CYCLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1c149a24b219.js` → `AtpCycleVisualization`.

#### Autocorrelation

Time-series pattern

Type `AUTOCORRELATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-82f35af984a3.js` → `Visualization`.

#### Average speed distance time

Type `AVERAGE_SPEED_DISTANCE_TIME` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-bb6d9e34b571.js` → `AverageSpeedDistanceTimeVisualization`.

#### Avogadros law

Amount of gas relative to the reference

Type `AVOGADROS_LAW` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8a73483282fe.js` → `Visualization`.

#### Balancing equations

Coefficient for {formula}

Type `BALANCING_EQUATIONS` · manifest v4.

Parameters: `reaction_example` (enum, default `hydrogen-and-oxygen-to-water`, one of `hydrogen-and-oxygen-to-water`, `nitrogen-and-hydrogen-to-ammonia`, `methane-combustion`).

Source: manifest `type-ee78dd3b1e31.js`; view `visualization-cdd97b6e0074.js` → `BalancingEquationsVisualization`.

#### Bank credit money multiplier

Type `BANK_CREDIT_MONEY_MULTIPLIER` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b94aa0d2a10e.js` → `BankCreditMoneyMultiplierVisualization`.

#### Bar magnet field strength

Type `BAR_MAGNET_FIELD_STRENGTH` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a3c28b974733.js` → `BarMagnetFieldStrengthVisualization`.

#### Bayes theorem

Type `BAYES_THEOREM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-65621ccef177.js` → `BayesTheoremVisualization`.

#### Bayesian beta binomial updating

Type `BAYESIAN_BETA_BINOMIAL_UPDATING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-17421d3211ef.js` → `BayesianBetaBinomialVisualization`.

#### Beer lambert law: `A = \varepsilon c l`

Type `BEER_LAMBERT_LAW` · manifest v3 · formula `A = \varepsilon c l`, also `A=\varepsilon l c`, `A = \epsilon c l`, `c = \frac{A}{\varepsilon l}`, `l = \frac{A}{\varepsilon c}`, `\varepsilon = \frac{A}{c l}`.

Parameters: `molarAbsorptivity` (number, default `1.2`, range 0.01 to 100000); `concentration` (number, default `0.8`, range 0.01 to 10); `pathLength` (number, default `1`, range 0.01 to 100).

Source: manifest `type-b34069051dae.js`; view `visualization-2ffd2d7ad26f.js` → `BeerLambertLawVisualization`.

#### Beta oxidation cycle

Type `BETA_OXIDATION_CYCLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1aca5434b81a.js` → `BetaOxidationVisualization`.

#### Bfs dfs traversal

Traversal algorithm

Type `BFS_DFS_TRAVERSAL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b506efdc87b4.js` → `Visualization`.

#### Big o growth comparison

Input size n

Type `BIG_O_GROWTH_COMPARISON` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-36595112514c.js` → `BigOGrowthComparisonVisualization`.

#### Big o time complexity

Input size n

Type `BIG_O_TIME_COMPLEXITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8943e77daee3.js` → `BigOTimeComplexityVisualization`.

#### Binary heap operations

Heap operation

Type `BINARY_HEAP_OPERATIONS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8105621dc4ae.js` → `BinaryHeapOperationsVisualization`.

#### Binary place value

Decimal value from 0 to 255

Type `BINARY_PLACE_VALUE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-51aec3593d50.js` → `BinaryPlaceValueVisualization`.

#### Binary search

Target value; type an exact value or use the slider

Type `BINARY_SEARCH` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7db8086fea1e.js` → `BinarySearchVisualization`.

#### Binary search tree insertion

Insertion order

Type `BINARY_SEARCH_TREE_INSERTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-23b86a2e6d9f.js` → `BinarySearchTreeInsertionVisualization`.

#### Binomial distribution

Type `BINOMIAL_DISTRIBUTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ec8b3c2d54e9.js` → `BinomialDistributionVisualization`.

#### Binomial square

Type `BINOMIAL_SQUARE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-9bcaf2a2049c.js` → `BinomialSquareVisualization`.

#### Binomial theorem pascal triangle

Type `BINOMIAL_THEOREM_PASCAL_TRIANGLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c5a292f8b66f.js` → `BinomialTheoremPascalTriangleVisualization`.

#### Biological ph and buffers: `\mathrm{pH}=\mathrm{p}K_a+\log_{10}\!\left(\frac{[A^-]}{[HA]}\right)`

Weak-acid buffer titration curve. At {challenge} buffer equivalents of {direction}, pH is {ph}; H A is {acidPercent} and A minus is {basePercent}. The pKa is {pKa}. {reserve}.

Type `BIOLOGICAL_PH_AND_BUFFERS` · manifest v3 · formula `\mathrm{pH}=\mathrm{p}K_a+\log_{10}\!\left(\frac{[A^-]}{[HA]}\right)`.

Parameters: `pKa` (number, default `7.2`, range 4.5 to 9.5).

Source: manifest `type-9b7b6f94e6e1.js`; view `visualization-3c05bc879e3b.js` → `Visualization`.

#### Biomagnification

Food-chain stage

Type `BIOMAGNIFICATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-bb79b0ac202c.js` → `Visualization`.

#### Biome climatograph

Biome climatograph with mean annual temperature on the horizontal axis and annual precipitation on the vertical axis. The selected climate is {temperature} degrees Celsius and {precipitation} centimeters per year, {biome}.

Type `BIOME_CLIMATOGRAPH` · manifest v2.

Parameters: `mean_annual_temperature_c` (number, default `18`, range -15 to 30); `annual_precipitation_cm` (number, default `100`, range 0 to 450).

Source: manifest `type-894614f7a446.js`; view `visualization-2c99676a31a2.js` → `BiomeClimatographVisualization`.

#### Blockchain hash chain

Type `BLOCKCHAIN_HASH_CHAIN` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f16370da6926.js` → `BlockchainHashChainVisualization`.

#### Blood circulation

Type `BLOOD_CIRCULATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5a5b952c74dd.js` → `BloodCirculationVisualization`.

#### Blood glucose regulation

Type `BLOOD_GLUCOSE_REGULATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-cb42d91e2a1d.js` → `BloodGlucoseVisualization`.

#### Blue white screening

Vector state

Type `BLUE_WHITE_SCREENING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-221d8b8213bd.js` → `BlueWhiteScreeningVisualization`.

#### Boiling point elevation

Solute molality

Type `BOILING_POINT_ELEVATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-08cc11972fec.js` → `BoilingPointElevationVisualization`.

#### Bomb calorimetry

Combustible sample mass

Type `BOMB_CALORIMETRY` · manifest v3.

Parameters: `sample_mass_g` (number, default `1`, range 0.25 to 2); `combustion_energy_kj_per_g` (number, default `24`, range 15 to 35); `calorimeter_heat_capacity_kj_per_k` (number, default `12`, range 8 to 25).

Source: manifest `type-cb7946b61519.js`; view `visualization-f0f7d99574e5.js` → `BombCalorimetryVisualization`.

#### Bond energy curve

Covalent bond order

Type `BOND_ENERGY_CURVE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-927dcecaea8c.js` → `BondEnergyCurveVisualization`.

#### Bond polarity

{atomName} ({symbol}), Pauling electronegativity {electronegativity}

Type `BOND_POLARITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ad676972bf64.js` → `BondPolarityVisualization`.

#### Boolean logic

Type `BOOLEAN_LOGIC` · manifest v2.

Parameters: `inputA` (boolean, default `true`); `inputB` (boolean, default `false`); `operator` (enum, default `and`, one of `and`, `or`).

Source: manifest `type-8da18ccae221.js`; view `visualization-2925ab9916b1.js` → `BooleanLogicVisualization`.

#### Boolean truth table

Type `BOOLEAN_TRUTH_TABLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a0078e1b16a6.js` → `BooleanTruthTableVisualization`.

#### Bootstrap distribution

Central confidence level

Type `BOOTSTRAP_DISTRIBUTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8b40fe61e46a.js` → `BootstrapDistributionVisualization`.

#### Born haber cycle

Ionic compound

Type `BORN_HABER_CYCLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4cc015e85a1e.js` → `Visualization`.

#### Break even quantity

Type `BREAK_EVEN_QUANTITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-6bb9126813a3.js` → `BreakEvenQuantityVisualization`.

#### Breathing mechanics

Breathing phase

Type `BREATHING_MECHANICS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-54605d2b01a4.js` → `Visualization`.

#### Bubble sort

Bubble sort actions

Type `BUBBLE_SORT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-76dd623bf208.js` → `BubbleSortVisualization`.

#### Buffer composition: `\mathrm{pH}=\mathrm{p}K_a+\log_{10}\!\left(\frac{[A^-]}{[HA]}\right)`

Conjugate-base-to-weak-acid ratio

Type `BUFFER_COMPOSITION` · manifest v4 · formula `\mathrm{pH}=\mathrm{p}K_a+\log_{10}\!\left(\frac{[A^-]}{[HA]}\right)`.

Parameters: `pKa` (number, default `4.76`, range 2 to 12); `baseToAcidRatio` (number, default `1`, range 0.01 to 100).

Source: manifest `type-4aeefa8d363c.js`; view `visualization-3b152003115a.js` → `BufferCompositionVisualization`.

#### Buffer ph strong acid base

Type `BUFFER_PH_STRONG_ACID_BASE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-19438d18ed3e.js` → `BufferPhStrongAcidBaseVisualization`.

#### Buoyancy

Type `BUOYANCY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-fd6de8cda090.js` → `BuoyancyVisualization`.

#### Business cycles

Examined time in the business cycle

Type `BUSINESS_CYCLES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8a96d62ed5f9.js` → `BusinessCyclesVisualization`.

#### C array pointer arithmetic

Type `C_ARRAY_POINTER_ARITHMETIC` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f88a75a08c4d.js` → `CArrayPointerArithmeticVisualization`.

#### Cadences

Type `CADENCES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-9f1fd4834d3d.js` → `Visualization`.

#### Calcium pth calcitonin feedback

Type `CALCIUM_PTH_CALCITONIN_FEEDBACK` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-de7e68836feb.js` → `CalciumFeedbackVisualization`.

#### Calvin cycle

Calvin-cycle phase

Type `CALVIN_CYCLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d838a1d37039.js` → `CalvinCycleVisualization`.

#### Capillary starling forces: `J_v=K_f[(P_c-P_i)-\sigma(\pi_c-\pi_i)]`

Select a Starling pressure

Type `CAPILLARY_STARLING_FORCES` · manifest v2 · formula `J_v=K_f[(P_c-P_i)-\sigma(\pi_c-\pi_i)]`.

Parameters: `initial_scenario` (enum, default `typical-systemic-capillary`, one of `typical-systemic-capillary`, `raised-capillary-hydrostatic-pressure`, `reduced-plasma-oncotic-pressure`, `raised-interstitial-oncotic-pressure`, `raised-interstitial-hydrostatic-pressure`).

Source: manifest `type-f530fb4543f1.js`; view `visualization-9a893a9d2ca9.js` → `CapillaryStarlingVisualization`.

#### Capital flows

Domestic versus foreign real interest rate

Type `CAPITAL_FLOWS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-892592c98946.js` → `CapitalFlowsVisualization`.

#### Carbohydrate structure

Type `CARBOHYDRATE_STRUCTURE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ca247791662d.js` → `Visualization`.

#### Carbon cycle

Carbon pathway

Type `CARBON_CYCLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-832a61703911.js` → `CarbonCycleVisualization`.

#### Carbonyl nucleophilic addition

Carbonyl substrate

Type `CARBONYL_NUCLEOPHILIC_ADDITION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-896d2eea2b71.js` → `Visualization`.

#### Cardiac action potential

Ventricular action-potential phase

Type `CARDIAC_ACTION_POTENTIAL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-570d5662d7d8.js` → `CardiacActionPotentialVisualization`.

#### Cardiac cycle

Cardiac-cycle phase

Type `CARDIAC_CYCLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-80a193605824.js` → `Visualization`.

#### Cardiac output product: `CO = HR \times SV`

Cardiac output pulse animation controls

Type `CARDIAC_OUTPUT_PRODUCT` · manifest v5 · formula `CO = HR \times SV`.

Parameters: `heartRateBeatsPerMinute` (number, default `70`, range 40 to 180); `strokeVolumeMilliliters` (number, default `70`, range 30 to 120).

Source: manifest `type-33538976a327.js`; view `visualization-6c2a667f2877.js` → `CardiacOutputProductVisualization`.

#### Catalyst activation energy

Catalyst effectiveness

Type `CATALYST_ACTIVATION_ENERGY` · manifest v4.

Parameters: `catalystEffectivenessPercent` (number, default `50`, range 0 to 100).

Source: manifest `type-af7f92e44cfd.js`; view `visualization-441df9ed1a85.js` → `CatalystActivationEnergyVisualization`.

#### Cathodic protection

Cathodic-protection state

Type `CATHODIC_PROTECTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b8676f5b1314.js` → `Visualization`.

#### Cell cycle

Cell-cycle phase

Type `CELL_CYCLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-bf00cef167da.js` → `CellCycleVisualization`.

#### Cell cycle checkpoints

Checkpoint

Type `CELL_CYCLE_CHECKPOINTS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7cace9cee8e3.js` → `CellCycleCheckpointsVisualization`.

#### Cell junctions

Selected epithelial junction

Type `CELL_JUNCTIONS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4bd36767aa08.js` → `Visualization`.

#### Cell membrane transport

Transport mechanism

Type `CELL_MEMBRANE_TRANSPORT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e56c65825dfd.js` → `Visualization`.

#### Cell organelles

Cell type

Type `CELL_ORGANELLES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-3b908912d373.js` → `Visualization`.

#### Cell signaling pathway

Cell signaling stage

Type `CELL_SIGNALING_PATHWAY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-dd2fd9f9d59a.js` → `CellSignalingPathwayVisualization`.

#### Cellular respiration inputs outputs

{glucose, plural, one {# glucose molecule} other {# glucose molecules}}

Type `CELLULAR_RESPIRATION_INPUTS_OUTPUTS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b12d7e091968.js` → `CellularRespirationVisualization`.

#### Central limit theorem

Population shape

Type `CENTRAL_LIMIT_THEOREM` · manifest v4.

Parameters: `population_shape` (enum, default `right-skewed`, one of `right-skewed`, `uniform`, `bimodal`, `normal`); `sample_size` (integer, default `5`, range 1 to 100).

Source: manifest `type-c608c5f26be7.js`; view `visualization-bc730e61850f.js` → `CentralLimitTheoremVisualization`.

#### Centripetal force mvr: `F_c = \frac{mv^2}{r}`

Type `CENTRIPETAL_FORCE_MVR` · manifest v2 · formula `F_c = \frac{mv^2}{r}`.

Parameters: `massKilograms` (number, default `2`, range 0.5 to 5); `speedMetersPerSecond` (number, default `4`, range 0 to 8); `radiusMeters` (number, default `2`, range 1 to 5).

Source: manifest `type-3b03c35824de.js`; view `visualization-724b910ab3b6.js` → `CentripetalForceVisualization`.

#### Change of basis

Type `CHANGE_OF_BASIS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c565aa08e2ff.js` → `ChangeOfBasisVisualization`.

#### Charles law: `\frac{V_1}{T_1} = \frac{V_2}{T_2}`

Type `CHARLES_LAW` · manifest v3 · formula `\frac{V_1}{T_1} = \frac{V_2}{T_2}`, also `V_1/T_1 = V_2/T_2`, `v1/t1=v2/t2`, `v2/t2=v1/t1`, `v/t=k`, `k=v/t`, `v=kt`, `kt=v`.

Parameters: `v1` (number, default `12`, range 0.01 to 10000); `t1` (number, default `300`, range 1 to 5000); `v2` (number, default `18`, range 0.01 to 10000); `t2` (number, default `450`, range 1 to 5000); `solveFor` (enum, default `v2`, one of `v1`, `t1`, `v2`, `t2`).

Source: manifest `type-fa03d5dd9600.js`; view `visualization-68e3a9daf6ad.js` → `CharlesLawVisualization`.

#### Chemiosmosis

Chemiosmosis process stage

Type `CHEMIOSMOSIS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ab918e1b9c3b.js` → `ChemiosmosisVisualization`.

#### Chi square distribution

Degrees of freedom

Type `CHI_SQUARE_DISTRIBUTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-bd06a0bcf94f.js` → `ChiSquareDistributionVisualization`.

#### Chi square goodness of fit: `\chi^2 = \sum \frac{(O_i-E_i)^2}{E_i}`

Observed count for category {category}

Type `CHI_SQUARE_GOODNESS_OF_FIT` · manifest v2 · formula `\chi^2 = \sum \frac{(O_i-E_i)^2}{E_i}`.

Parameters: `observedA` (integer, default `18`, range 5 to 60); `observedB` (integer, default `22`, range 5 to 60); `observedC` (integer, default `27`, range 5 to 60); `observedD` (integer, default `33`, range 5 to 60).

Source: manifest `type-f50250083878.js`; view `visualization-e8c3cb7ed74d.js` → `ChiSquareGoodnessOfFitVisualization`.

#### Chi square independence

Type `CHI_SQUARE_INDEPENDENCE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-6e5c5bd2d5b9.js` → `ChiSquareIndependenceVisualization`.

#### Chirality and r s configuration

Choose a stereochemistry example

Type `CHIRALITY_AND_R_S_CONFIGURATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c903aa361f6e.js` → `Visualization`.

#### Chord construction

Type `CHORD_CONSTRUCTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8d4472cda5f2.js` → `Visualization`.

#### Chromatography

Chromatogram development

Type `CHROMATOGRAPHY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-render-22fea844a534.js` → `Visualization`.

#### Circle area

Type `CIRCLE_AREA` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-decacaaaa2b9.js` → `CircleAreaVisualization`.

#### Circle circumference

Type `CIRCLE_CIRCUMFERENCE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5634d03745c9.js` → `CircleCircumferenceVisualization`.

#### Classes of levers

Type `CLASSES_OF_LEVERS` · manifest v3.

Parameters: `leverClass` (enum, default `first`, one of `first`, `second`, `third`).

Source: manifest `type-93019a122ac1.js`; view `visualization-451fb5c3a8b2.js` → `ClassesOfLeversVisualization`.

#### Classical conditioning

Type `CLASSICAL_CONDITIONING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-267440d1aba5.js` → `ClassicalConditioningVisualization`.

#### Classification threshold

Type `CLASSIFICATION_THRESHOLD` · manifest v5.

Parameters: `threshold` (number, default `0.5`, range 0 to 1).

Source: manifest `type-dca95d451915.js`; view `visualization-b03dc44eb8f4.js` → `ClassificationThresholdVisualization`.

#### Classification tree

Revealed tree depth

Type `CLASSIFICATION_TREE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-626d5075c58e.js` → `ClassificationTreeVisualization`.

#### Climate feedback loops

Climate mechanism

Type `CLIMATE_FEEDBACK_LOOPS` · manifest v2.

Parameters: `initial_mechanism` (enum, default `ice-albedo`, one of `ice-albedo`, `water-vapor`, `radiative-response`); `initial_change` (enum, default `warming`, one of `warming`, `cooling`).

Source: manifest `type-81172b31949f.js`; view `visualization-85c7f9ceffe4.js` → `ClimateFeedbackLoopsVisualization`.

#### Climate mitigation wedges

{count, plural, =0 {zero wedges} one {one wedge} other {# wedges}}

Type `CLIMATE_MITIGATION_WEDGES` · manifest v3.

Parameters: `required_wedges` (integer, default `7`, range 3 to 12); `horizon_years` (integer, default `50`, range 20 to 100).

Source: manifest `type-6a0aad7ace5c.js`; view `visualization-b9ed1a0c327b.js` → `ClimateMitigationWedgesVisualization`.

#### Clonal selection and immune memory

Clonal-selection stage

Type `CLONAL_SELECTION_AND_IMMUNE_MEMORY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-fa4ce5283796.js` → `ClonalSelectionVisualization`.

#### Co2 and temperature time series

Climate time span

Type `CO2_AND_TEMPERATURE_TIME_SERIES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5e4bd82a77e1.js` → `Visualization`.

#### Coal power plant

Generation stage

Type `COAL_POWER_PLANT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-eb0fb4c8b40d.js` → `CoalPowerPlantVisualization`.

#### Codon chart

Type `CODON_CHART` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-228e45c43fca.js` → `CodonChartVisualization`.

#### Cohens d: `d = \frac{\bar{x}_2 - \bar{x}_1}{s_{\mathrm{pooled}}}`

Signed difference between group 2 and group 1 means

Type `COHENS_D` · manifest v2 · formula `d = \frac{\bar{x}_2 - \bar{x}_1}{s_{\mathrm{pooled}}}`.

Parameters: `initial_mean_difference` (number, default `0.8`, range -4 to 4); `pooled_standard_deviation` (number, default `1`, range 0.75 to 2).

Source: manifest `type-8848a63b92ff.js`; view `visualization-7fd64fee5266.js` → `CohensDVisualization`.

#### Coin flipping

Type `COIN_FLIPPING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ddf8c024b16f.js` → `CoinFlippingVisualization`.

#### Collision orientation

Type `COLLISION_ORIENTATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-91f3020deb3b.js` → `CollisionOrientationVisualization`.

#### Collision simulation: `m_1v_{1,i} + m_2v_{2,i} = m_1v_{1,f} + m_2v_{2,f}`

Type `COLLISION_SIMULATION` · manifest v5 · formula `m_1v_{1,i} + m_2v_{2,i} = m_1v_{1,f} + m_2v_{2,f}`.

Parameters: `cartAInitialVelocityMps` (number, default `2`, range -3 to 3); `cartBInitialVelocityMps` (number, default `-1.5`, range -3 to 3); `collisionType` (enum, default `elastic`, one of `elastic`, `perfectlyInelastic`).

Source: manifest `type-833c7fb020af.js`; view `visualization-3ec23aa150c3.js` → `CollisionSimulationVisualization`.

#### Combination formula

Type `COMBINATION_FORMULA` · manifest v4.

Parameters: `n` (integer, default `6`, range 4 to 8); `r` (integer, default `3`, range 2 to 4).

Source: manifest `type-1635fe6bba2b.js`; view `visualization-4446fc85d276.js` → `CombinationFormulaVisualization`.

#### Combined gas law

Type `COMBINED_GAS_LAW` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-71aa23e1fc0c.js` → `CombinedGasLawVisualization`.

#### Combining like terms tiles

Example {number}: {expression}

Type `COMBINING_LIKE_TERMS_TILES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-34edf98b37f6.js` → `CombiningLikeTermsTilesVisualization`.

#### Common ion effect

Type `COMMON_ION_EFFECT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-18a4f729b67b.js` → `CommonIonEffectVisualization`.

#### Common normal intervals

Number of standard deviations from the mean

Type `COMMON_NORMAL_INTERVALS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8b82316485d5.js` → `CommonNormalIntervalsVisualization`.

#### Comparative advantage trade

Producer A capacity allocated to Good X, percent

Type `COMPARATIVE_ADVANTAGE_TRADE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-71e1512b689d.js` → `ComparativeAdvantageTradeVisualization`.

#### Competition and niches

Preferred-resource similarity

Type `COMPETITION_AND_NICHES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-36ef0b11b9d2.js` → `CompetitionAndNichesVisualization`.

#### Competitive firm loss

Market price

Type `COMPETITIVE_FIRM_LOSS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-18a959db0b8c.js` → `CompetitiveFirmLossVisualization`.

#### Competitive firm profit

Market price

Type `COMPETITIVE_FIRM_PROFIT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f13e5f81d847.js` → `CompetitiveFirmProfitVisualization`.

#### Competitive labor hiring

Type `COMPETITIVE_LABOR_HIRING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5610ebafc07b.js` → `CompetitiveLaborHiringVisualization`.

#### Composite perimeter area

Choose what to measure

Type `COMPOSITE_PERIMETER_AREA` · manifest v1.

Parameters: `lowerWidth` (integer, default `6`, range 4 to 7); `lowerHeight` (integer, default `3`, range 2 to 4); `upperWidth` (integer, default `3`, range 2 to 3); `upperHeight` (integer, default `2`, range 1 to 3); `triangleRun` (integer, default `4`, range 1 to 4); `mode` (enum, default `area`, one of `area`, `perimeter`).

Source: manifest `type-94076f401ee2.js`; view `visualization-bc60a567a520.js` → `CompositePerimeterAreaVisualization`.

#### Compound interest

Type `COMPOUND_INTEREST` · manifest v9.

Parameters: `amount` (number, default `1000`, range 0.01 to 1000000000); `ratePercent` (number, default `5`, range 0 to 100); `periods` (integer, default `20`, range 0 to 1000).

Source: manifest `type-ea02b25da175.js`; view `visualization-bf52e82df6c5.js` → `CompoundInterestVisualization`.

#### Compound pulley mechanical advantage: `\mathrm{IMA}=n`

Type `COMPOUND_PULLEY_MECHANICAL_ADVANTAGE` · manifest v4 · formula `\mathrm{IMA}=n`.

Parameters: `supportSegments` (integer, default `2`, range 2 to 6).

Source: manifest `type-58df9aa6d32b.js`; view `visualization-2782131e7539.js` → `CompoundPulleyVisualization`.

#### Compressor curve

Compressor transfer curve with threshold {threshold} decibels, ratio {ratio}, and knee width {knee} decibels. At an input of {input} decibels, output is {output} decibels with {reduction} decibels of gain reduction.

Type `COMPRESSOR_CURVE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-144bc1831d49.js` → `Visualization`.

#### Concentration cell: `E_{\mathrm{cell}}=\frac{0.0592\,\mathrm{V}}{z}\log_{10}\!\left(\frac{c_{\mathrm{high}}}{c_{\mathrm{low}}}\right)`

Initial concentrated-to-dilute ion concentration ratio

Type `CONCENTRATION_CELL` · manifest v2 · formula `E_{\mathrm{cell}}=\frac{0.0592\,\mathrm{V}}{z}\log_{10}\!\left(\frac{c_{\mathrm{high}}}{c_{\mathrm{low}}}\right)`.

Parameters: `initial_dilute_concentration_molar` (number, default `0.001`, range 0.0001 to 0.001); `initial_concentrated_concentration_molar` (number, default `0.1`, range 0.001 to 0.1); `ion_charge` (integer, default `2`, range 1 to 3).

Source: manifest `type-facf186bb1fa.js`; view `visualization-e3fcd843d810.js` → `Visualization`.

#### Conditional probability definition

Type `CONDITIONAL_PROBABILITY_DEFINITION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4677715c283e.js` → `ConditionalProbabilityDefinitionVisualization`.

#### Conductometric titration

Volume of sodium hydroxide added

Type `CONDUCTOMETRIC_TITRATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b06b77ca7049.js` → `Visualization`.

#### Cone surface area: `A = \pi r(r + l)`

Type `CONE_SURFACE_AREA` · manifest v3 · formula `A = \pi r(r + l)`, also `A = \pi r (r + l)`, `A = \pi r^2 + \pi r l`, `A = \pi r l + \pi r^2`, `\pi r (r + l) = A`, `\pi r^2 + \pi r l = A`, `\pi r l + \pi r^2 = A`.

Parameters: `radius` (number, default `3`, range 0.01 to 10000); `slantHeight` (number, default `6`, range 0.01 to 10000).

Source: manifest `type-286f80bf78cd.js`; view `visualization-dab53e407fb1.js` → `ConeSurfaceAreaVisualization`.

#### Cone volume: `V = \frac{1}{3}\pi r^2 h`

Type `CONE_VOLUME` · manifest v4 · formula `V = \frac{1}{3}\pi r^2 h`, also `V = \frac{1}{3} \pi r^2 h`, `V = \frac{1}{3} \pi h r^2`, `V = \pi r^2 h / 3`, `V = \pi h r^2 / 3`, `\frac{1}{3} \pi r^2 h = V`, `\frac{1}{3} \pi h r^2 = V`, `\pi r^2 h / 3 = V`, `\pi h r^2 / 3 = V`.

Parameters: `radius` (number, default `3`, range 0.01 to 10000); `height` (number, default `8`, range 0.01 to 10000).

Source: manifest `type-92907d86d962.js`; view `visualization-6062832c20c5.js` → `ConeVolumeVisualization`.

#### Confidence interval proportion: `\hat p \pm z^*\sqrt{\frac{\hat p(1-\hat p)}{n}}`

Sampling distribution of the observed sample proportion {estimate}. The {confidence} interval for the unknown population proportion runs from {lower} to {upper}, with margin of error {margin}. The central area is {confidence} and each tail is {tail}. {condition}

Type `CONFIDENCE_INTERVAL_PROPORTION` · manifest v4 · formula `\hat p \pm z^*\sqrt{\frac{\hat p(1-\hat p)}{n}}`.

Parameters: `sample_proportion` (number, default `0.4`, range 0.02 to 0.98); `sample_size` (integer, default `100`, range 100 to 400); `confidence_level` (number, default `0.95`, range 0.9 to 0.99).

Source: manifest `type-1e1a69bc5852.js`; view `visualization-13bb8ff69ba4.js` → `Visualization`.

#### Confidence vs prediction bands

Regression plot at x equals {x}, with {count} observed responses. The {level} confidence interval for the mean is {meanLow} to {meanHigh}; the wider {level} prediction interval for one new response is {predictionLow} to {predictionHigh}. Both are centered on the fitted response {mean}.

Type `CONFIDENCE_VS_PREDICTION_BANDS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8e366224bae8.js` → `ConfidenceVsPredictionBandsVisualization`.

#### Confusion matrix metrics

Type `CONFUSION_MATRIX_METRICS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f9b8a9313cab.js` → `ConfusionMatrixMetricsVisualization`.

#### Conjugated dienes and diels alder

Type `CONJUGATED_DIENES_AND_DIELS_ALDER` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-cd6ba7d916f3.js` → `DielsAlderVisualization`.

#### Consumer and producer surplus

Type `CONSUMER_AND_PRODUCER_SURPLUS` · manifest v4.

Parameters: `demand_shift` (number, default `0`, range -2.5 to 2.5).

Source: manifest `type-1a390930447d.js`; view `visualization-f8e6ae17459a.js` → `Visualization`.

#### Consumer budget line comparative statics

Budget change scenario

Type `CONSUMER_BUDGET_LINE_COMPARATIVE_STATICS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-aaf8f436ab7e.js` → `ConsumerBudgetLineVisualization`.

#### Context free grammar ambiguity

Type `CONTEXT_FREE_GRAMMAR_AMBIGUITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-60fb5e2f4e61.js` → `Visualization`.

#### Continuous uniform distribution

Selected interval width as percent of support

Type `CONTINUOUS_UNIFORM_DISTRIBUTION` · manifest v2.

Parameters: `lower_bound` (number, default `0`, range -20 to 10); `upper_bound` (number, default `15`, range 11 to 40).

Source: manifest `type-19d8b437a2d9.js`; view `visualization-2218ed2936b9.js` → `Visualization`.

#### Contour lines and relief

Route endpoint A. Use arrow keys to move A.

Type `CONTOUR_LINES_AND_RELIEF` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4cecbd55002e.js` → `Visualization`.

#### Coral bleaching

Coral bleaching stage

Type `CORAL_BLEACHING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a5ca1d0c2874.js` → `CoralBleachingVisualization`.

#### Corrective policy

Type `CORRECTIVE_POLICY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-760bd55c85de.js` → `CorrectivePolicyVisualization`.

#### Correlation

Correlation direction

Type `CORRELATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ebe45bb8c09c.js` → `CorrelationVisualization`.

#### Correlation matrix

Variable pair

Type `CORRELATION_MATRIX` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d3d4bc296ea1.js` → `CorrelationMatrixVisualization`.

#### Cortisol regulation

Type `CORTISOL_REGULATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1f23860d1169.js` → `CortisolRegulationVisualization`.

#### Coulombs law: `F = k\frac{q_1q_2}{r^2}`

Type `COULOMBS_LAW` · manifest v3 · formula `F = k\frac{q_1q_2}{r^2}`, also `F = k \frac{q_1 q_2}{r^2}`, `F = k_e \frac{q_1 q_2}{r^2}`, `F = \frac{k q_1 q_2}{r^2}`, `E = k\frac{q}{r^2}`, `F = k q_1 q_2 / r^2`, `k q_1 q_2 / r^2 = F`, `r = \sqrt{\frac{k q_1 q_2}{F}}`, `q_1 = \frac{F r^2}{k q_2}`, `q_2 = \frac{F r^2}{k q_1}`, `k = \frac{F r^2}{q_1 q_2}`.

Parameters: `q1` (number, default `3`, range -10000 to 10000); `q2` (number, default `-3`, range -10000 to 10000); `distance` (number, default `4`, range 0.01 to 10000).

Source: manifest `type-98e888d7432f.js`; view `visualization-5989f3f846f9.js` → `CoulombsLawVisualization`.

#### Counting sequences

Type `COUNTING_SEQUENCES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7e5cdac470d2.js` → `CountingSequencesVisualization`.

#### Cpu fetch decode execute

Instruction-cycle step

Type `CPU_FETCH_DECODE_EXECUTE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-31245ab54f0a.js` → `CpuFetchDecodeExecuteVisualization`.

#### Crispr cas9

Target site

Type `CRISPR_CAS9` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-866f65ef32ed.js` → `Visualization`.

#### Critical angle sine relation: `\sin\theta_c = \frac{n_2}{n_1}`

Type `CRITICAL_ANGLE_SINE_RELATION` · manifest v2 · formula `\sin\theta_c = \frac{n_2}{n_1}`.

Parameters: `indexRatio` (number, default `0.67`, range 0.5 to 0.95).

Source: manifest `type-945e0105df87.js`; view `visualization-9680b2d624d4.js` → `CriticalAngleSineRelationVisualization`.

#### Critical path network

Activity {task} duration in days

Type `CRITICAL_PATH_NETWORK` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-80db478a1349.js` → `CriticalPathNetworkVisualization`.

#### Cross price elasticity

Product relationship

Type `CROSS_PRICE_ELASTICITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-dcbcd3c02373.js` → `CrossPriceElasticityVisualization`.

#### Cross product geometry: `|a\times b|=|a||b|\sin(\theta)`

Type `CROSS_PRODUCT_GEOMETRY` · manifest v1 · formula `|a\times b|=|a||b|\sin(\theta)`, also `\|\vec a\times\vec b\|=\|\vec a\|\|\vec b\|\sin(\theta)`, `\vec a\times\vec b`, `\vec b\times\vec a=-(\vec a\times\vec b)`, `\|\vec a\times\vec b\|=\text{parallelogram area}`.

Parameters: `magnitudeA` (number, default `3`, range 0.5 to 6); `magnitudeB` (number, default `2.5`, range 0.5 to 6); `angleDeg` (number, default `60`, range 5 to 175); `order` (enum, default `axb`, one of `axb`, `bxa`).

Source: manifest `type-25a004ce6551.js`; view `visualization-f61f046288a8.js` → `CrossProductGeometryVisualization`.

#### Crossing over

Crossing over stage

Type `CROSSING_OVER` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-63710b333d74.js` → `CrossingOverVisualization`.

#### Crowding out

Type `CROWDING_OUT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ca98395cd3a3.js` → `Visualization`.

#### Crystal unit cells

Cubic unit-cell type

Type `CRYSTAL_UNIT_CELLS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a718698538ee.js` → `Visualization`.

#### Currency appreciation

Type `CURRENCY_APPRECIATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-97cef07aec84.js` → `CurrencyAppreciationVisualization`.

#### Current to magnetic field

Direction of current through the wire

Type `CURRENT_TO_MAGNETIC_FIELD` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-9e3f91c7593a.js` → `CurrentToMagneticFieldVisualization`.

#### Current to magnetic field direction

Conventional current upward

Type `CURRENT_TO_MAGNETIC_FIELD_DIRECTION` · manifest v1.

Parameters: `currentDirection` (enum, default `up`, one of `up`, `down`).

Source: manifest `type-8ea75e03943c.js`; view `visualization-713049f1d3db.js` → `CurrentToMagneticFieldDirectionVisualization`.

#### Cyclohexane chair flips

Substituted cyclohexane example

Type `CYCLOHEXANE_CHAIR_FLIPS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-3413f1e88925.js` → `Visualization`.

#### Cylinder volume: `V = \pi r^2 h`

Type `CYLINDER_VOLUME` · manifest v3 · formula `V = \pi r^2 h`, also `V = \pi h r^2`, `\pi r^2 h = V`, `\pi h r^2 = V`, `h = \frac{V}{\pi r^2}`, `r^2 = \frac{V}{\pi h}`.

Parameters: `radius` (number, default `3`, range 0.01 to 10000); `height` (number, default `8`, range 0.01 to 10000).

Source: manifest `type-e93330f8f338.js`; view `visualization-72c4640c99fa.js` → `CylinderVolumeVisualization`.

#### Dc circuit power: `P = VI`

Type `DC_CIRCUIT_POWER` · manifest v4 · formula `P = VI`.

Parameters: `voltageVolts` (number, default `12`, range 1 to 24); `resistanceOhms` (number, default `6`, range 1 to 24).

Source: manifest `type-81adbb1f028d.js`; view `visualization-2f2d3d659a2c.js` → `DcCircuitPowerVisualization`.

#### Decibel safety

Type `DECIBEL_SAFETY` · manifest v4.

Parameters: `sound_level_dba` (number, default `85`, range 82 to 100); `exposure_duration_minutes` (integer, default `480`, range 0 to 960).

Source: manifest `type-b72953d55796.js`; view `visualization-c59cf037d42c.js` → `Visualization`.

#### Decision tree classification path

Type `DECISION_TREE_CLASSIFICATION_PATH` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e588c881079d.js` → `DecisionTreeClassificationPathVisualization`.

#### Degree of unsaturation

Type `DEGREE_OF_UNSATURATION` · manifest v2.

Parameters: `example_formula` (enum, default `C6H10`, one of `C2H6`, `C4H8`, `C6H10`, `C6H6`, `C4H6Br2`, `C5H8O`, `C5H9N`).

Source: manifest `type-60f4e9362b4d.js`; view `visualization-8153a0645399.js` → `DegreeOfUnsaturationVisualization`.

#### Dehydration synthesis vs hydrolysis

Reaction direction

Type `DEHYDRATION_SYNTHESIS_VS_HYDROLYSIS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-778ea5b8bb6c.js` → `Visualization`.

#### Delta g k e relationship

Type `DELTA_G_K_E_RELATIONSHIP` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-91e371b0967c.js` → `DeltaGKERelationshipVisualization`.

#### Demand curve

Type `DEMAND_CURVE` · manifest v3.

Parameters: `price` (number, default `5`, range 1 to 9); `demand_shift` (number, default `0`, range -1 to 1).

Source: manifest `type-759e4fab0713.js`; view `visualization-ca7e47c0d986.js` → `Visualization`.

#### Demand elasticity

Demand responsiveness

Type `DEMAND_ELASTICITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-542bf9571edd.js` → `Visualization`.

#### Demand shock

Type `DEMAND_SHOCK` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-477abe2925ef.js` → `DemandShockVisualization`.

#### Denial of service overload

Request flow animation

Type `DENIAL_OF_SERVICE_OVERLOAD` · manifest v5.

Parameters: `server_capacity` (integer, default `120`, range 100 to 300); `legitimate_request_rate` (integer, default `40`, range 10 to 80).

Source: manifest `type-253ef788d0bb.js`; view `visualization-d0d141c913ff.js` → `Visualization`.

#### Derivative

Type `DERIVATIVE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-667f54f92ebb.js` → `DerivativeVisualization`.

#### Derivative as secant: `f'(a)=\lim_{h\to0^+}\frac{f(a+h)-f(a)}{h}`

Positive horizontal change h from P to Q

Type `DERIVATIVE_AS_SECANT` · manifest v3 · formula `f'(a)=\lim_{h\to0^+}\frac{f(a+h)-f(a)}{h}`.

Parameters: `functionExpression` (enum, default `x^2`, one of `x^2`, `x^3`, `x^3-x`, `sin(x)`, `cos(x)`, `e^x`); `xValue` (number, default `1`, range -10 to 10); `h` (number, default `2`, range 0.05 to 4).

Source: manifest `type-b5036e205e38.js`; view `visualization-9f8928e6b428.js` → `DerivativeAsSecantVisualization`.

#### Derivative product rule: `(fg)' = f'g + fg'`

Type `DERIVATIVE_PRODUCT_RULE` · manifest v2 · formula `(fg)' = f'g + fg'`.

Parameters: `deltaX` (number, default `2`, range 0.05 to 2).

Source: manifest `type-3f3e34153e7c.js`; view `visualization-e8ef2ad5a3ef.js` → `DerivativeProductRuleVisualization`.

#### Detergent micelle grease

Relative detergent amount

Type `DETERGENT_MICELLE_GREASE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-6bb3517deee2.js` → `DetergentMicelleGreaseVisualization`.

#### Dice rolling

Type `DICE_ROLLING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-852a09cf6fc3.js` → `DiceRollingVisualization`.

#### Dichotomous key

Type `DICHOTOMOUS_KEY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a206454903b7.js` → `DichotomousKeyVisualization`.

#### Difference in differences: `\widehat{\tau}_{DiD} = \Delta Y_T - \Delta Y_C`

Type `DIFFERENCE_IN_DIFFERENCES` · manifest v3 · formula `\widehat{\tau}_{DiD} = \Delta Y_T - \Delta Y_C`.

Parameters: `treated_pre_outcome` (number, default `60`, range 20 to 80); `control_pre_outcome` (number, default `40`, range 20 to 80); `common_change` (number, default `8`, range -15 to 15); `treatment_effect` (number, default `14`, range -20 to 20).

Source: manifest `type-62bcf9304582.js`; view `visualization-49a0c2b52117.js` → `Visualization`.

#### Difference of squares

Type `DIFFERENCE_OF_SQUARES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-9deff093a7b5.js` → `DifferenceOfSquaresVisualization`.

#### Diffusion

Type `DIFFUSION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a7c6b2d70f0b.js` → `DiffusionVisualization`.

#### Digestive tract absorption

Nutrient to trace

Type `DIGESTIVE_TRACT_ABSORPTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-346f6131bb53.js` → `DigestiveTractAbsorptionVisualization`.

#### Dijkstra shortest path

Type `DIJKSTRA_SHORTEST_PATH` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e39d693d1989.js` → `DijkstraShortestPathVisualization`.

#### Diminishing marginal returns

Type `DIMINISHING_MARGINAL_RETURNS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f2379a6876c2.js` → `MarginalProductVisualization`.

#### Diminishing marginal utility

Marginal and total utility graph. {quantity, plural, =0 {No units are selected} one {Unit 1 contributes {marginal, number} utility} other {Unit {quantity, number} contributes {marginal, number} utility}}; total utility is {total, number}. Marginal utility falls with each unit, while total utility rises more slowly, levels off, and eventually falls.

Type `DIMINISHING_MARGINAL_UTILITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4de2eeea680d.js` → `Visualization`.

#### Direct inverse proportion

Type `DIRECT_INVERSE_PROPORTION` · manifest v4.

Parameters: `x` (number, default `1`, range 0.5 to 2.5).

Source: manifest `type-bd43c0bf82aa.js`; view `visualization-ab9fb553b896.js` → `DirectInverseProportionVisualization`.

#### Discrete event queue simulation

Arrival pattern

Type `DISCRETE_EVENT_QUEUE_SIMULATION` · manifest v4.

Parameters: `workload` (enum, default `bursty`, one of `spaced`, `bursty`).

Source: manifest `type-178545bdd851.js`; view `visualization-cf42ccd675fe.js` → `DiscreteEventQueueSimulationVisualization`.

#### Discriminant

Type `DISCRIMINANT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-53972df5c5a6.js` → `DiscriminantVisualization`.

#### Dissolution

Dissolution stage

Type `DISSOLUTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8cd8d35e841e.js` → `Visualization`.

#### Distance formula

Type `DISTANCE_FORMULA` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-19f5929d5f24.js` → `DistanceFormulaVisualization`.

#### Distance traveled vs displacement

Type `DISTANCE_TRAVELED_VS_DISPLACEMENT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-459ca56e75bc.js` → `DistanceTraveledVsDisplacementVisualization`.

#### Distillation

Distillation stage

Type `DISTILLATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-837ac24663f7.js` → `DistillationVisualization`.

#### Distributive property: `a(b+c)=ab+ac`

Type `DISTRIBUTIVE_PROPERTY` · manifest v2 · formula `a(b+c)=ab+ac`.

Parameters: `a` (integer, default `8`, range 2 to 8); `b` (integer, default `7`, range 2 to 8); `c` (integer, default `7`, range 2 to 8).

Source: manifest `type-50c9fc73ec1d.js`; view `visualization-247c263b84b2.js` → `DistributivePropertyVisualization`.

#### Divide conquer recurrence tree

Choose recurrence example

Type `DIVIDE_CONQUER_RECURRENCE_TREE` · manifest v1.

Parameters: `recurrence_example` (enum, default `T(n) = 2T(n/2) + n`, one of `T(n) = 2T(n/2) + 1`, `T(n) = 2T(n/2) + n`, `T(n) = 2T(n/2) + n^2`).

Source: manifest `type-603f86db5a64.js`; view `visualization-2af1ff844f2a.js` → `DivideConquerRecurrenceTreeVisualization`.

#### Dna gel fragment migration

Type `DNA_GEL_FRAGMENT_MIGRATION` · manifest v2.

Parameters: `runTimeMinutes` (integer, default `18`, range 1 to 40); `fragmentSizeBasePairs` (integer, default `700`, range 100 to 2000).

Source: manifest `type-72629e85a720.js`; view `visualization-8585a3e8189c.js` → `DnaGelFragmentMigrationVisualization`.

#### Dna replication fork

Type `DNA_REPLICATION_FORK` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-664a4d20a8ec.js` → `DnaReplicationForkVisualization`.

#### Dna transcription

Type `DNA_TRANSCRIPTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-2a97ecd87416.js` → `DnaTranscriptionVisualization`.

#### Dns resolution

Cache miss: follow the nameserver hierarchy

Type `DNS_RESOLUTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b13c4dc77770.js` → `DnsResolutionVisualization`.

#### Doppler effect

Type `DOPPLER_EFFECT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4ea82f5a7a73.js` → `DopplerEffectVisualization`.

#### Dose response curve

Potency shift: same efficacy, different potency

Type `DOSE_RESPONSE_CURVE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4a5781452a96.js` → `DoseResponseVisualization`.

#### Dot plot

Data set

Type `DOT_PLOT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a6e7deaa0954.js` → `DotPlotVisualization`.

#### Dot product angle

Type `DOT_PRODUCT_ANGLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-beb55cb7e12e.js` → `DotProductAngleVisualization`.

#### Double entry transaction effects

Type `DOUBLE_ENTRY_TRANSACTION_EFFECTS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-eb7583bdf175.js` → `DoubleEntryTransactionEffectsVisualization`.

#### Double fertilization

Double-fertilization stage

Type `DOUBLE_FERTILIZATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7af7ea820386.js` → `Visualization`.

#### Drum grid notation

Choose eighth-note or sixteenth-note subdivision

Type `DRUM_GRID_NOTATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ee6526004d2f.js` → `DrumGridNotationVisualization`.

#### Dynamic equilibrium

Reactant-rich start

Type `DYNAMIC_EQUILIBRIUM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-df3adbf3e175.js` → `Visualization`.

#### Dynamics and articulation

Type `DYNAMICS_AND_ARTICULATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b88a8ae3fac8.js` → `Visualization`.

#### Earth layers and convection

Mantle-convection stage

Type `EARTH_LAYERS_AND_CONVECTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e3dd0b9e51cc.js` → `Visualization`.

#### Ecological footprint

Type `ECOLOGICAL_FOOTPRINT` · manifest v5.

Parameters: `focus_year` (integer, default `2014`, range 1961 to 2014).

Source: manifest `type-e177a5957273.js`; view `visualization-e6f3b0fdd180.js` → `EcologicalFootprintVisualization`.

#### Ecological succession stages

Stage {number, number}: {stage}

Type `ECOLOGICAL_SUCCESSION_STAGES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e9f2bf6bb07f.js` → `EcologicalSuccessionVisualization`.

#### Ecological tolerance curve

Relative {factor} condition from low to high

Type `ECOLOGICAL_TOLERANCE_CURVE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-20b2983a62fc.js` → `EcologicalToleranceCurveVisualization`.

#### Economic externalities

Type `ECONOMIC_EXTERNALITIES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-91b2e864b5b4.js` → `NegativeExternalityVisualization`.

#### Economic order quantity

Type `ECONOMIC_ORDER_QUANTITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c32f94a2230f.js` → `EconomicOrderQuantityVisualization`.

#### Economies of scale

Type `ECONOMIES_OF_SCALE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-857ec2d9d8ca.js` → `LongRunAtcVisualization`.

#### Eigendirections: `A\mathbf{v}=\lambda\mathbf{v}`

Type `EIGENDIRECTIONS` · manifest v3 · formula `A\mathbf{v}=\lambda\mathbf{v}`.

Parameters: `a11` (number, default `2`, range -2 to 2); `a12` (number, default `1`, range -2 to 2); `a21` (number, default `1`, range -2 to 2); `a22` (number, default `2`, range -2 to 2).

Source: manifest `type-9dd1c641b080.js`; view `visualization-570e19431f8b.js` → `EigendirectionsVisualization`.

#### Ekg parts

Type `EKG_PARTS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-76c278f5b358.js` → `EkgPartsVisualization`.

#### El nino and la nina

Type `EL_NINO_AND_LA_NINA` · manifest v2.

Parameters: `initial_phase` (enum, default `Neutral`, one of `La Niña`, `Neutral`, `El Niño`).

Source: manifest `type-44fc1ec684df.js`; view `visualization-9f09ed89c7ba.js` → `ElNinoAndLaNinaVisualization`.

#### Elasticity total revenue

Price

Type `ELASTICITY_TOTAL_REVENUE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-320c0f68fb8d.js` → `ElasticityTotalRevenueVisualization`.

#### Electric current charge flow: `I = \frac{Q}{t}`

Type `ELECTRIC_CURRENT_CHARGE_FLOW` · manifest v3 · formula `I = \frac{Q}{t}`.

Parameters: `packetRatePerSecond` (number, default `4`, range 1 to 8); `chargePerPacketCoulombs` (number, default `1`, range 0.5 to 3).

Source: manifest `type-dcb1b5569c53.js`; view `visualization-f08fa5395c00.js` → `ElectricCurrentChargeFlowVisualization`.

#### Electric field

Type `ELECTRIC_FIELD` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f13c1d8ba890.js` → `ElectricFieldVisualization`.

#### Electric field multiple charges

Type `ELECTRIC_FIELD_MULTIPLE_CHARGES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b1ee914d2eb6.js` → `ElectricFieldMultipleChargesVisualization`.

#### Electric flux flat surface: `\Phi_E = EA\cos(\theta)`

Electric field magnitude

Type `ELECTRIC_FLUX_FLAT_SURFACE` · manifest v2 · formula `\Phi_E = EA\cos(\theta)`.

Parameters: `fieldStrengthNewtonsPerCoulomb` (number, default `6`, range 0 to 10); `areaSquareMeters` (number, default `3`, range 0.5 to 5); `angleDegrees` (number, default `30`, range 0 to 90).

Source: manifest `type-8d1ac0d714c4.js`; view `visualization-aedb8e2ae175.js` → `ElectricFluxFlatSurfaceVisualization`.

#### Electrical resistance factors

Type `ELECTRICAL_RESISTANCE_FACTORS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e0ba7a46f357.js` → `ElectricalResistanceFactorsVisualization`.

#### Electrolyte conductivity

{solution}, {strength}

Type `ELECTROLYTE_CONDUCTIVITY` · manifest v3.

Parameters: `initial_solution` (enum, default `potassium-chloride`, one of `potassium-chloride`, `acetic-acid`, `ethanol`); `initial_concentration` (number, default `0.6`, range 0.1 to 1).

Source: manifest `type-ba543fe66918.js`; view `visualization-8ec33178602d.js` → `ElectrolyteConductivityVisualization`.

#### Electrolytic cell

Type `ELECTROLYTIC_CELL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-dd74066d258b.js` → `Visualization`.

#### Electromagnetic spectrum

Electromagnetic band

Type `ELECTROMAGNETIC_SPECTRUM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-19840ed7156b.js` → `ElectromagneticSpectrumVisualization`.

#### Electron orbital filling

Type `ELECTRON_ORBITAL_FILLING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-45933547bfdc.js` → `ElectronOrbitalFillingVisualization`.

#### Element vs compound vs mixture

Particle sample

Type `ELEMENT_VS_COMPOUND_VS_MIXTURE` · manifest v2.

Parameters: `initial_sample` (enum, default `monatomic element`, one of `monatomic element`, `diatomic element`, `molecular compound`, `mixture of elements`, `mixture of element and compound`, `mixture of compounds`).

Source: manifest `type-ea91da6d3b05.js`; view `visualization-8b502e9b3702.js` → `Visualization`.

#### Elementary row operations

Gaussian elimination step

Type `ELEMENTARY_ROW_OPERATIONS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a13a41387fe6.js` → `ElementaryRowOperationsVisualization`.

#### Empirical rule

Within {count, plural, one {# standard deviation} other {# standard deviations}}

Type `EMPIRICAL_RULE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b341819433a1.js` → `EmpiricalRuleVisualization`.

#### Empirical vs molecular formula

Type `EMPIRICAL_VS_MOLECULAR_FORMULA` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1058102ac051.js` → `Visualization`.

#### Endocrine feedback axis

Peripheral-hormone state

Type `ENDOCRINE_FEEDBACK_AXIS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-2237b638f4d4.js` → `Visualization`.

#### Endocytosis and exocytosis

Transport stage

Type `ENDOCYTOSIS_AND_EXOCYTOSIS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-42d513148bfa.js` → `Visualization`.

#### Endomembrane pathway

Cargo destination

Type `ENDOMEMBRANE_PATHWAY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b758d418a1f3.js` → `Visualization`.

#### Energy coupling

ATP cycle path

Type `ENERGY_COUPLING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-fe871f0ddfab.js` → `EnergyCouplingVisualization`.

#### Energy efficiency sankey diagram: `\text{Efficiency}=\frac{\text{useful output}}{\text{total input}}`

Change the percentage of input energy transferred usefully

Type `ENERGY_EFFICIENCY_SANKEY_DIAGRAM` · manifest v2 · formula `\text{Efficiency}=\frac{\text{useful output}}{\text{total input}}`.

Parameters: `energy_system` (enum, default `light bulb`, one of `light bulb`, `electric motor`, `car engine`); `input_energy_joules` (number, default `100`, range 1 to 10000); `initial_efficiency_percent` (number, default `40`, range 0 to 100).

Source: manifest `type-c20db913b337.js`; view `visualization-847e4d172d2d.js` → `EnergyEfficiencySankeyVisualization`.

#### Enthalpy

Type `ENTHALPY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-2b2034fc95a4.js` → `EnthalpyVisualization`.

#### Entropy and dispersal

Type `ENTROPY_AND_DISPERSAL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-493a8d56f448.js` → `Visualization`.

#### Enzyme and temperature

Type `ENZYME_AND_TEMPERATURE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-869fd4ad696f.js` → `EnzymeAndTemperatureVisualization`.

#### Enzyme inhibition rate effects

Relative substrate concentration

Type `ENZYME_INHIBITION_RATE_EFFECTS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-20498cc1ea9e.js` → `EnzymeInhibitionRateEffectsVisualization`.

#### Enzyme lock key cycle

Type `ENZYME_LOCK_KEY_CYCLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-714d7e209691.js` → `EnzymeLockKeyCycleVisualization`.

#### Epigenetics

Chromatin state

Type `EPIGENETICS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ec548b3209b9.js` → `Visualization`.

#### Epsp ipsp summation

Type `EPSP_IPSP_SUMMATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d1a680eabf68.js` → `EpspIpspSummationVisualization`.

#### Eq curve

Center frequency in hertz

Type `EQ_CURVE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-6d10f2db2ae2.js` → `Visualization`.

#### Equilateral triangle

Type `EQUILATERAL_TRIANGLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-75418d3a2c36.js` → `EquilateralTriangleVisualization`.

#### Equilibrium concentration graph

Species added at equilibrium

Type `EQUILIBRIUM_CONCENTRATION_GRAPH` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5136e13364ea.js` → `EquilibriumConcentrationVisualization`.

#### Eukaryotic gene regulation

Chromatin accessibility

Type `EUKARYOTIC_GENE_REGULATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-704313df2f73.js` → `Visualization`.

#### Euler formula

Type `EULER_FORMULA` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8da26cb234d9.js` → `EulerFormulaVisualization`.

#### Eutrophication

Type `EUTROPHICATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-cb43ad4b85c0.js` → `EutrophicationVisualization`.

#### Evaporation rate factors

Particle attraction strength

Type `EVAPORATION_RATE_FACTORS` · manifest v1.

Parameters: `temperatureCelsius` (number, default `25`, range 10 to 60); `surfaceAreaPercent` (number, default `60`, range 25 to 100); `airflowMetersPerSecond` (number, default `1`, range 0 to 3); `humidityPercent` (number, default `40`, range 0 to 100); `attraction` (enum, default `medium`, one of `weak`, `medium`, `strong`).

Source: manifest `type-119bdab76cbe.js`; view `visualization-e3dfff296f24.js` → `EvaporationRateFactorsVisualization`.

#### Even odd function symmetry

Type `EVEN_ODD_FUNCTION_SYMMETRY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4030ae450a3e.js` → `EvenOddFunctionSymmetryVisualization`.

#### Expected value weighted average

Type `EXPECTED_VALUE_WEIGHTED_AVERAGE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-87fa6b607431.js` → `ExpectedValueWeightedAverageVisualization`.

#### Exponent laws repeated multiplication

Type `EXPONENT_LAWS_REPEATED_MULTIPLICATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-3c4a811c5466.js` → `ExponentLawsRepeatedMultiplicationVisualization`.

#### Exponential decay: `y = e^{-kt}`

Type `EXPONENTIAL_DECAY` · manifest v4 · formula `y = e^{-kt}`, also `y = y_0 \exp(-kt)`, `y = e^{-t}`, `y = 2e^{-0.5t}`, `N = N_0 e^{-\lambda t}`, `A = A_0 e^{-\lambda t}`.

Parameters: `initial` (number, default `6`, range 0.01 to 10000); `decay` (number, default `0.6`, range 0.01 to 10000).

Source: manifest `type-33f0d487d38b.js`; view `visualization-5c9ca0146ef3.js` → `ExponentialDecayVisualization`.

#### Exponential distribution

Constant event rate

Type `EXPONENTIAL_DISTRIBUTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-3db00c160211.js` → `ExponentialDistributionVisualization`.

#### Exports

Type `EXPORTS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-54e48c1bf756.js` → `ExportsVisualization`.

#### Eye accommodation

Type `EYE_ACCOMMODATION` · manifest v1.

Parameters: `objectDistanceMeters` (number, default `1`, range 0.25 to 6).

Source: manifest `type-42a870b7bbdb.js`; view `visualization-f131d7806578.js` → `EyeAccommodationVisualization`.

#### Eye prescription

Sphere power in diopters

Type `EYE_PRESCRIPTION` · manifest v1.

Parameters: `sphereDiopters` (number, default `2.5`, range -10 to 10); `cylinderDiopters` (number, default `-0.5`, range -6 to 6); `axisDegrees` (number, default `135`, range 0 to 180).

Source: manifest `type-ba89e7f5dcc4.js`; view `visualization-144b57aab714.js` → `EyePrescriptionVisualization`.

#### Factor pairs arrays

Rows in the array

Type `FACTOR_PAIRS_ARRAYS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-2e63cc21350a.js` → `FactorPairsArraysVisualization`.

#### Fahrenheit celsius scale: `F = \frac{9}{5}C + 32`

{landmark}, {valueCount, plural, one {{value} degree Celsius} other {{value} degrees Celsius}}

Type `FAHRENHEIT_CELSIUS_SCALE` · manifest v1 · formula `F = \frac{9}{5}C + 32`.

Parameters: `celsius` (number, default `0`, range -40 to 120).

Source: manifest `type-7ff60fd7b3ba.js`; view `visualization-ad66e0ef223a.js` → `FahrenheitCelsiusScaleVisualization`.

#### Faradays law electrolysis

Total charge passed

Type `FARADAYS_LAW_ELECTROLYSIS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-437a7118b72c.js` → `Visualization`.

#### Fatty acid saturation

Type `FATTY_ACID_SATURATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-cddea43a7390.js` → `FattyAcidSaturationVisualization`.

#### Fermentation

Fermentation route

Type `FERMENTATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f5df8d5f3572.js` → `FermentationVisualization`.

#### Fifo lifo cost flow

Type `FIFO_LIFO_COST_FLOW` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-6f9a1f597d7c.js` → `FifoLifoCostFlowVisualization`.

#### Filling rates: `r_{\mathrm{net}}=r_{\mathrm{in}}-r_{\mathrm{out}}`

Type `FILLING_RATES` · manifest v2 · formula `r_{\mathrm{net}}=r_{\mathrm{in}}-r_{\mathrm{out}}`.

Parameters: `inflowRateLitersPerMinute` (number, default `6`, range 0 to 8); `outflowRateLitersPerMinute` (number, default `2`, range 0 to 8).

Source: manifest `type-33d5b92afbca.js`; view `visualization-4c46b74c06c8.js` → `FillingRatesVisualization`.

#### Filtration

Starting mixture

Type `FILTRATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5848c0b8feab.js` → `Visualization`.

#### Finite state machine

Type `FINITE_STATE_MACHINE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-929f23419b4f.js` → `FiniteStateMachineVisualization`.

#### Fire triangle fire tetrahedron

Fire diagram

Type `FIRE_TRIANGLE_FIRE_TETRAHEDRON` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a35da19faaa2.js` → `Visualization`.

#### Firm cost curves

Selected output quantity

Type `FIRM_COST_CURVES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-899098305537.js` → `FirmCostCurvesVisualization`.

#### First order ode

Initial value y at x equals {initialX}

Type `FIRST_ORDER_ODE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f09df8e51832.js` → `FirstOrderOdeVisualization`.

#### Fiscal policy

Type `FISCAL_POLICY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-dbcf4987be77.js` → `FiscalPolicyVisualization`.

#### Fisheries and maximum sustainable yield

Fishing effort index

Type `FISHERIES_AND_MAXIMUM_SUSTAINABLE_YIELD` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-24a9f6bc972c.js` → `FisheriesAndMaximumSustainableYieldVisualization`.

#### Fitness and adaptation

Selective environment

Type `FITNESS_AND_ADAPTATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-2ed9aa3a73ee.js` → `FitnessAndAdaptationVisualization`.

#### Fixed perimeter rectangle area

Type `FIXED_PERIMETER_RECTANGLE_AREA` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e45c965e039c.js` → `FixedPerimeterRectangleAreaVisualization`.

#### Fixed ratio scaling

Type `FIXED_RATIO_SCALING` · manifest v3.

Parameters: `scaleFactor` (number, default `1.5`, range 0.5 to 2).

Source: manifest `type-6d69838b61ac.js`; view `visualization-67be01b3ccbf.js` → `FixedRatioScalingVisualization`.

#### Flower pollination

Pollination type

Type `FLOWER_POLLINATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4da5e7ac419a.js` → `FlowerPollinationVisualization`.

#### Fluid mosaic membrane

Type `FLUID_MOSAIC_MEMBRANE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5c308f39bf3f.js` → `Visualization`.

#### Foil binomial

Type `FOIL_BINOMIAL` · manifest v2.

Parameters: `a` (number, default `1`, range -12 to 12); `b` (number, default `3`, range -12 to 12); `c` (number, default `1`, range -12 to 12); `d` (number, default `2`, range -12 to 12).

Source: manifest `type-49e9f66a2d98.js`; view `visualization-889603c0aa15.js` → `FoilBinomialVisualization`.

#### Food chain

Trace the food chain

Type `FOOD_CHAIN` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-82767a161fb7.js` → `Visualization`.

#### Foreign exchange market

Type `FOREIGN_EXCHANGE_MARKET` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-64b7ee282a83.js` → `Visualization`.

#### Forestry methods

Regeneration method

Type `FORESTRY_METHODS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-616ac467d4df.js` → `Visualization`.

#### Formal charge

Structure {structure}, atom {position}, {element}

Type `FORMAL_CHARGE` · manifest v3.

Parameters: `example` (enum, default `carbon-dioxide-candidates`, one of `carbon-dioxide-candidates`, `nitrite-resonance`, `ammonium`).

Source: manifest `type-23b0e0e9a23b.js`; view `visualization-b3d5865f8dc0.js` → `FormalChargeVisualization`.

#### Fossil fuel formation

Fuel pathway

Type `FOSSIL_FUEL_FORMATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-3affe8b48f69.js` → `FossilFuelFormationVisualization`.

#### Founder effect and bottleneck

Chance-sampling event

Type `FOUNDER_EFFECT_AND_BOTTLENECK` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-96d29f83111e.js` → `Visualization`.

#### Four to one multiplexer

Type `FOUR_TO_ONE_MULTIPLEXER` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e04a31cafc83.js` → `FourToOneMultiplexerVisualization`.

#### Fractions number line

Type `FRACTIONS_NUMBER_LINE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a8bebdf5fab9.js` → `FractionsNumberLineVisualization`.

#### Free fall: `h(t) = h_0 + v_0t - \frac{1}{2}gt^2`

Type `FREE_FALL` · manifest v2 · formula `h(t) = h_0 + v_0t - \frac{1}{2}gt^2`.

Parameters: `initialHeightMeters` (number, default `14`, range 4 to 18); `initialVelocityMetersPerSecond` (number, default `0`, range -8 to 8).

Source: manifest `type-f5876f848904.js`; view `visualization-5c1f7388dde7.js` → `FreeFallVisualization`.

#### Freezing point depression

Solute molality in moles per kilogram of solvent

Type `FREEZING_POINT_DEPRESSION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5e03e049203b.js` → `FreezingPointDepressionVisualization`.

#### Frequency spectrum

Type `FREQUENCY_SPECTRUM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-923b2515d58b.js` → `FrequencySpectrumVisualization`.

#### Function call stack

Program moment

Type `FUNCTION_CALL_STACK` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-17f53cc836e0.js` → `FunctionCallStackVisualization`.

#### Function composition

Type `FUNCTION_COMPOSITION` · manifest v1.

Parameters: `input_value` (number, default `2`, range -10 to 10); `g_operation` (enum, default `add 2`, one of `add 2`, `multiply by 3`, `square`, `negate`); `f_operation` (enum, default `multiply by 3`, one of `add 2`, `multiply by 3`, `square`, `negate`); `composition_order` (enum, default `g_then_f`, one of `g_then_f`, `f_then_g`).

Source: manifest `type-08ab5fc42dc6.js`; view `visualization-0b4f421b434d.js` → `FunctionCompositionVisualization`.

#### Futures hedge locked revenue

Type `FUTURES_HEDGE_LOCKED_REVENUE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-2b88d6324703.js` → `FuturesHedgeLockedRevenueVisualization`.

#### Fx net exports ad

Type `FX_NET_EXPORTS_AD` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7ac7202b7a4c.js` → `FxNetExportsAdVisualization`.

#### Gains from trade

Good 1 produced

Type `GAINS_FROM_TRADE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-cf06ad4e8bf9.js` → `GainsFromTradeVisualization`.

#### Galvanic cell

Galvanic-cell state

Type `GALVANIC_CELL` · manifest v2.

Parameters: `cell_pair` (enum, default `zinc-copper`, one of `zinc-copper`, `copper-silver`).

Source: manifest `type-448ce06dc011.js`; view `visualization-404aad54fdd4.js` → `Visualization`.

#### Gas solubility

Type `GAS_SOLUBILITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a8e8ed3e92ac.js` → `GasSolubilityVisualization`.

#### Gaussian surface symmetry

Type `GAUSSIAN_SURFACE_SYMMETRY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7711cc8b7b75.js` → `GaussianSurfaceSymmetryVisualization`.

#### Gay lussacs law

Pressure-temperature plot for the same sealed rigid gas sample. State 1 is {temperatureOneCount, plural, one {{temperatureOne} kelvin} other {{temperatureOne} kelvin}} and {pressureOneCount, plural, one {{pressureOne} kilopascal} other {{pressureOne} kilopascals}}. State 2 is {temperatureTwoCount, plural, one {{temperatureTwo} kelvin} other {{temperatureTwo} kelvin}} and {pressureTwoCount, plural, one {{pressureTwo} kilopascal} other {{pressureTwo} kilopascals}}. Volume and gas amount are fixed, so pressure changes in the same proportion as Kelvin temperature.

Type `GAY_LUSSACS_LAW` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ba1540ae2fec.js` → `GayLussacsLawVisualization`.

#### Gcd

Rectangle side A, {value, plural, one {# unit} other {# units}}. Drag horizontally.

Type `GCD` · manifest v1.

Parameters: `first_number` (integer, default `18`, range 2 to 24); `second_number` (integer, default `12`, range 2 to 24).

Source: manifest `type-a2fa2066a9f8.js`; view `visualization-cee6bed1a5de.js` → `GcdVisualization`.

#### Gcf lcm

Type `GCF_LCM` · manifest v1.

Parameters: not read (the manifest module could not be evaluated).

Source: manifest `type-aff47f4eaed1.js`; view `visualization-aa43cc6ed3a3.js` → `GcfLcmVisualization`.

#### Gdp expenditure identity

Type `GDP_EXPENDITURE_IDENTITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c136ba1aa622.js` → `GdpExpenditureIdentityVisualization`.

#### Gdp value double counting

Type `GDP_VALUE_DOUBLE_COUNTING` · manifest v2.

Parameters: `countMode` (enum, default `sales`, one of `sales`, `valueAdded`).

Source: manifest `type-18452383754a.js`; view `visualization-aa4f0613babb.js` → `GdpValueDoubleCountingVisualization`.

#### Genetic drift

Type `GENETIC_DRIFT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-47710bb8450b.js` → `Visualization`.

#### Geometric distribution

Per-trial success probability p

Type `GEOMETRIC_DISTRIBUTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1c8b2f62180e.js` → `GeometricDistributionVisualization`.

#### Geometric series

First term {variable}

Type `GEOMETRIC_SERIES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-bf4baaf7f3fa.js` → `GeometricSeriesVisualization`.

#### Geothermal power

Type `GEOTHERMAL_POWER` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ac0a1a52e723.js` → `GeothermalPowerVisualization`.

#### Ghk membrane potential: `P_{\mathrm{ion}}\uparrow \Rightarrow V_m \to E_{\mathrm{ion}}`

Sodium-to-potassium permeability ratio

Type `GHK_MEMBRANE_POTENTIAL` · manifest v1 · formula `P_{\mathrm{ion}}\uparrow \Rightarrow V_m \to E_{\mathrm{ion}}`.

Parameters: `sodiumToPotassiumPermeabilityRatio` (number, default `0.04`, range 0 to 1); `chlorideToPotassiumPermeabilityRatio` (number, default `0.45`, range 0 to 1).

Source: manifest `type-b2f3bbb776a0.js`; view `visualization-5882bc55eb83.js` → `GhkMembranePotentialVisualization`.

#### Gibbs free energy: `\Delta G^\circ=-RT\ln K`

Type `GIBBS_FREE_ENERGY` · manifest v3 · formula `\Delta G^\circ=-RT\ln K`, also `\Delta_{\mathrm r}G^\circ=-RT\ln K`.

Parameters: `deltaGKilojoulesPerMole` (number, default `-20`, range -50 to 50).

Source: manifest `type-7d87631529a2.js`; view `visualization-7e11be41728f.js` → `GibbsFreeEnergyVisualization`.

#### Global atmospheric circulation

Circulation cell

Type `GLOBAL_ATMOSPHERIC_CIRCULATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-efb639131ab5.js` → `Visualization`.

#### Glycolysis

Glycolysis stage

Type `GLYCOLYSIS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-eaf697fcd3ac.js` → `GlycolysisVisualization`.

#### Gpcr signaling

G-protein pathway

Type `GPCR_SIGNALING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c032329c84c0.js` → `GpcrSignalingVisualization`.

#### Gpp vs npp: `\mathrm{NPP}=\mathrm{GPP}-R_a`

Gross primary productivity

Type `GPP_VS_NPP` · manifest v2 · formula `\mathrm{NPP}=\mathrm{GPP}-R_a`.

Parameters: `gross_primary_productivity` (number, default `240`, range 100 to 400); `autotrophic_respiration` (number, default `80`, range 0 to 100).

Source: manifest `type-1aff40f97e6c.js`; view `visualization-4949941be5a2.js` → `GppVsNppVisualization`.

#### Gram stain

Type `GRAM_STAIN` · manifest v1.

Parameters: `bacteriaType` (enum, default `positive`, one of `positive`, `negative`).

Source: manifest `type-6ec40c0e5685.js`; view `visualization-4b847b117fd2.js` → `GramStainVisualization`.

#### Grand staff piano map

Choose an octave

Type `GRAND_STAFF_PIANO_MAP` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-3833693d5f3e.js` → `Visualization`.

#### Graphable function

Type `GRAPHABLE_FUNCTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8de20535a32d.js` → `GraphableFunctionVisualization`.

#### Graphable function (v2)

Type `GRAPHABLE_FUNCTION_V2` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-99f16fd8ae72.js` → `GraphableFunctionV2Visualization`.

#### Greenhouse infrared trapping

Type `GREENHOUSE_INFRARED_TRAPPING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ac7275af6191.js` → `GreenhouseInfraredTrappingVisualization`.

#### Guitar chord chart

Type `GUITAR_CHORD_CHART` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-194d54002f4a.js` → `Visualization`.

#### Guitar fretboard map

Highlight a pitch class

Type `GUITAR_FRETBOARD_MAP` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-9ff06061066d.js` → `Visualization`.

#### Guitar scale patterns

Type `GUITAR_SCALE_PATTERNS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7390fbbffb41.js` → `Visualization`.

#### Habitat fragmentation

Patch connectivity

Type `HABITAT_FRAGMENTATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4e57cdae72b2.js` → `HabitatFragmentationVisualization`.

#### Half full adder logic

Type `HALF_FULL_ADDER_LOGIC` · manifest v2.

Parameters: `a` (boolean, default `true`); `b` (boolean, default `false`); `carryIn` (boolean, default `true`).

Source: manifest `type-6637f6f4ce37.js`; view `visualization-cd5f9cccbb7c.js` → `HalfFullAdderLogicVisualization`.

#### Half life relation

Type `HALF_LIFE_RELATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f91fff1fbcc8.js` → `HalfLifeRelationVisualization`.

#### Halogen reactivity trend

Type `HALOGEN_REACTIVITY_TREND` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-14035ed0d6c9.js` → `HalogenReactivityVisualization`.

#### Hardy weinberg equilibrium

Frequency of allele A

Type `HARDY_WEINBERG_EQUILIBRIUM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-32593bbcd8ea.js` → `HardyWeinbergVisualization`.

#### Hash table collisions

Collision-resolution strategy

Type `HASH_TABLE_COLLISIONS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-724a6d5b82a5.js` → `HashTableCollisionsVisualization`.

#### Hemoglobin curve

Oxygen partial pressure

Type `HEMOGLOBIN_CURVE` · manifest v1.

Parameters: `oxygenPartialPressureMmHg` (number, default `40`, range 0 to 120); `ph` (number, default `7.4`, range 7.2 to 7.6); `carbonDioxidePartialPressureMmHg` (number, default `40`, range 20 to 60); `temperatureCelsius` (number, default `37`, range 35 to 39).

Source: manifest `type-9f5bb286483b.js`; view `visualization-3bd0b1ce38e5.js` → `HemoglobinCurveVisualization`.

#### Hemostasis and clotting

Hemostasis stage

Type `HEMOSTASIS_AND_CLOTTING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-16284a368884.js` → `HemostasisVisualization`.

#### Herons formula area

Type `HERONS_FORMULA_AREA` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a7f94feb7f78.js` → `HeronsFormulaAreaVisualization`.

#### Heteroskedasticity

Type `HETEROSKEDASTICITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-db53855cfdc8.js` → `HeteroskedasticityVisualization`.

#### Histogram

Distribution shape

Type `HISTOGRAM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-49e7b62d1d1b.js` → `HistogramVisualization`.

#### Homogeneous ode roots: `ay''+by'+cy=0`

Coefficient {coefficient} for {dependentVariable} double prime

Type `HOMOGENEOUS_ODE_ROOTS` · manifest v3 · formula `ay''+by'+cy=0`.

Parameters: `a` (number, default `1`, range 0.1 to 100); `b` (number, default `2`, range -10000 to 10000); `c` (number, default `5`, range -10000 to 10000).

Source: manifest `type-9e1fda92abdc.js`; view `visualization-e87c852014f4.js` → `HomogeneousOdeRootsVisualization`.

#### Homogeneous vs heterogeneous mixture

Type `HOMOGENEOUS_VS_HETEROGENEOUS_MIXTURE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-14b40402185d.js` → `Visualization`.

#### Homologous structures

Trace a corresponding bone group

Type `HOMOLOGOUS_STRUCTURES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a8059c29507a.js` → `HomologousStructuresVisualization`.

#### Hookes law

Type `HOOKES_LAW` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e7a7edb70461.js` → `HookesLawVisualization`.

#### Http protocol

{protocol} exchange step

Type `HTTP_PROTOCOL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-9f07a41fcc9b.js` → `HttpProtocolVisualization`.

#### Human body systems map

Select an organ system

Type `HUMAN_BODY_SYSTEMS_MAP` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-df936a279291.js` → `Visualization`.

#### Hybridization sigma pi bonds

Type `HYBRIDIZATION_SIGMA_PI_BONDS` · manifest v1.

Parameters: `hybridization` (enum, default `sp2`, one of `sp3`, `sp2`, `sp`).

Source: manifest `type-6fafbd960065.js`; view `visualization-c132408c5a62.js` → `HybridizationVisualization`.

#### Hydrocarbon structures

Type `HYDROCARBON_STRUCTURES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-14b167c39b7f.js` → `Visualization`.

#### Hydroelectric dam

Type `HYDROELECTRIC_DAM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5b2fe3eeee6d.js` → `Visualization`.

#### Hydrogen fuel cell

Fuel-cell process stage

Type `HYDROGEN_FUEL_CELL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8b8e8e501723.js` → `HydrogenFuelCellVisualization`.

#### Hypergeometric distribution

Successes in the population

Type `HYPERGEOMETRIC_DISTRIBUTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c4bb9ecdd60b.js` → `HypergeometricDistributionVisualization`.

#### Hyperopia

Object distance in meters

Type `HYPEROPIA` · manifest v3.

Parameters: `objectDistanceMeters` (number, default `0.5`, range 0.25 to 6).

Source: manifest `type-9f359e6ad739.js`; view `visualization-63ee2ec0fb7f.js` → `HyperopiaVisualization`.

#### Ideal transformer: `\frac{V_s}{V_p}=\frac{N_s}{N_p}`

Type `IDEAL_TRANSFORMER` · manifest v2 · formula `\frac{V_s}{V_p}=\frac{N_s}{N_p}`.

Parameters: `turnsRatio` (number, default `2`, range 0.1 to 10); `loadResistanceOhms` (number, default `30`, range 1 to 10000).

Source: manifest `type-f90cbc2eec2d.js`; view `visualization-e037f61faf2f.js` → `IdealTransformerVisualization`.

#### Ieee 754 floating point

Type `IEEE_754_FLOATING_POINT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b3f1bfbd9414.js` → `Ieee754Visualization`.

#### If statement execution flow

Score

Type `IF_STATEMENT_EXECUTION_FLOW` · manifest v1.

Parameters: `score` (integer, default `60`, range 0 to 100).

Source: manifest `type-62569be7b3b6.js`; view `visualization-f72c4bac791e.js` → `IfStatementExecutionFlowVisualization`.

#### Igneous cooling rate and crystal size

Slow underground cooling

Type `IGNEOUS_COOLING_RATE_AND_CRYSTAL_SIZE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8b5ac7531070.js` → `Visualization`.

#### Immune cell phagocytosis

Phagocytosis stage

Type `IMMUNE_CELL_PHAGOCYTOSIS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-cb550fcfea9a.js` → `ImmuneCellPhagocytosisVisualization`.

#### Import quota

Type `IMPORT_QUOTA` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-3572a1a8ab93.js` → `ImportQuotaVisualization`.

#### Incidence vs prevalence

Type `INCIDENCE_VS_PREVALENCE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a8e94be4ad96.js` → `IncidenceVsPrevalenceVisualization`.

#### Inclined plane acceleration: `a = g \sin \theta`

Incline angle

Type `INCLINED_PLANE_ACCELERATION` · manifest v2 · formula `a = g \sin \theta`.

Parameters: `planeAngleDegrees` (number, default `30`, range 15 to 45); `boxMassKilograms` (number, default `4`, range 2 to 6).

Source: manifest `type-dc5d4e4fe966.js`; view `visualization-3d68aaa572ee.js` → `InclinedPlaneAccelerationVisualization`.

#### Independent assortment

Metaphase-I orientation

Type `INDEPENDENT_ASSORTMENT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c347bad01aab.js` → `Visualization`.

#### Independent probability intersection

Type `INDEPENDENT_PROBABILITY_INTERSECTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1c8e44478ccd.js` → `IndependentProbabilityIntersectionVisualization`.

#### Initial rate experiment

Vary reactant {reactant}

Type `INITIAL_RATE_EXPERIMENT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8cb83c81ac76.js` → `InitialRateExperimentVisualization`.

#### Innate vs adaptive immunity

Immune-response timeline

Type `INNATE_VS_ADAPTIVE_IMMUNITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7d3653bd2d7a.js` → `Visualization`.

#### Insertion sort

Insertion sort actions

Type `INSERTION_SORT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5d74f4651416.js` → `InsertionSortVisualization`.

#### Instrument families

Type `INSTRUMENT_FAMILIES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-46cdd329b51f.js` → `Visualization`.

#### Insulin deficiency vs resistance

Type `INSULIN_DEFICIENCY_VS_RESISTANCE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f268c8cfff62.js` → `Visualization`.

#### Integral

Type `INTEGRAL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-91864adce3e1.js` → `IntegralVisualization`.

#### Integration by parts

Type `INTEGRATION_BY_PARTS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e8ee2533f3aa.js` → `IntegrationByPartsVisualization`.

#### Integration estimation

Type `INTEGRATION_ESTIMATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-3a0c29afd536.js` → `IntegrationEstimationVisualization`.

#### Intermolecular forces

Choose a molecular example

Type `INTERMOLECULAR_FORCES` · manifest v1.

Parameters: `initial_example` (enum, default `water`, one of `methane`, `hydrogen chloride`, `water`).

Source: manifest `type-9e89df8b418e.js`; view `visualization-758bf2180620.js` → `IntermolecularForcesVisualization`.

#### International trade world price

Type `INTERNATIONAL_TRADE_WORLD_PRICE` · manifest v3.

Parameters: `world_price` (number, default `40`, range 18 to 82).

Source: manifest `type-df5248337cc3.js`; view `visualization-6b1864f0e75e.js` → `InternationalTradeWorldPriceVisualization`.

#### Ionic bond formation

Type `IONIC_BOND_FORMATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-de15c783ed9a.js` → `IonicBondFormationVisualization`.

#### Ionic formulas

Choose a cation

Type `IONIC_FORMULAS` · manifest v2.

Parameters: `cation` (enum, default `aluminum`, one of `sodium`, `potassium`, `silver`, `magnesium`, `calcium`, `zinc`, `barium`, `aluminum`, `iron_iii`); `anion` (enum, default `oxide`, one of `chloride`, `fluoride`, `bromide`, `oxide`, `sulfide`, `nitride`, `phosphide`).

Source: manifest `type-892c2b1ba446.js`; view `visualization-b5bb13bd6b7d.js` → `IonicFormulasVisualization`.

#### Ionic lattice

Sodium ion center

Type `IONIC_LATTICE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-6014cc5cdb89.js` → `Visualization`.

#### Ionic vs covalent

Type `IONIC_VS_COVALENT` · manifest v1.

Parameters: `bondType` (enum, default `ionic`, one of `ionic`, `covalent`).

Source: manifest `type-72520cdd5971.js`; view `visualization-6de963031d61.js` → `IonicVsCovalentVisualization`.

#### Ir spectroscopy

Type `IR_SPECTROSCOPY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-247303f2053e.js` → `Visualization`.

#### Irrigation and salinization

Drainage condition

Type `IRRIGATION_AND_SALINIZATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-81f9e3f2f58f.js` → `IrrigationVisualization`.

#### Island biogeography

Island-biogeography equilibrium graph for a {case}. Equilibrium richness is {richness} of {sourcePool} source-pool species. Immigration and extinction are equal at a nonzero turnover rate of {turnover}. The four cases run from small and far, with the fewest species, to large and near, with the most.

Type `ISLAND_BIOGEOGRAPHY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-82343f130f78.js` → `Visualization`.

#### Isosceles triangle

Type `ISOSCELES_TRIANGLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-67f96b1e6f6f.js` → `IsoscelesTriangleVisualization`.

#### Isotope atomic mass

Choose an element

Type `ISOTOPE_ATOMIC_MASS` · manifest v2.

Parameters: `element` (enum, default `chlorine`, one of `boron`, `carbon`, `neon`, `magnesium`, `sulfur`, `chlorine`, `copper`).

Source: manifest `type-b5e0ca3b765a.js`; view `visualization-6ba3dcfddb37.js` → `IsotopeAtomicMassVisualization`.

#### Iupac hydrocarbon naming

Type `IUPAC_HYDROCARBON_NAMING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7199aa7e5da0.js` → `Visualization`.

#### Joint marginal conditional table

{rowLabel} and {columnLabel}: {count, plural, one {# student} other {# students}}

Type `JOINT_MARGINAL_CONDITIONAL_TABLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-67d2db6ee7e4.js` → `JointMarginalConditionalTableVisualization`.

#### Kaplan meier survival curve

No censoring

Type `KAPLAN_MEIER_SURVIVAL_CURVE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-fec0b6b636cf.js` → `Visualization`.

#### Keynesian cross

Marginal propensity to consume

Type `KEYNESIAN_CROSS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f313f2f80ebe.js` → `KeynesianCrossVisualization`.

#### Keystone species and trophic cascade

Keystone present

Type `KEYSTONE_SPECIES_AND_TROPHIC_CASCADE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-14e7268bbaa4.js` → `KeystoneCascadeVisualization`.

#### Kinase cascade

Kinase cascade stage

Type `KINASE_CASCADE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-be4374aaa2bc.js` → `KinaseCascadeVisualization`.

#### Kinematics displacement uniform acceleration

Type `KINEMATICS_DISPLACEMENT_UNIFORM_ACCELERATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7c945c47656f.js` → `KinematicsDisplacementUniformAccelerationVisualization`.

#### Kinematics position

Type `KINEMATICS_POSITION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-404144f8c36b.js` → `KinematicsPositionVisualization`.

#### Kinematics velocity squared

Position-time plot from zero to {time} seconds, ending at displacement {displacement} meters.

Type `KINEMATICS_VELOCITY_SQUARED` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b6b5e2aa02ab.js` → `KinematicsVelocitySquaredVisualization`.

#### Kinetic and potential energy: `E_{\text{total}} = PE + KE`

Type `KINETIC_AND_POTENTIAL_ENERGY` · manifest v2 · formula `E_{\text{total}} = PE + KE`.

Parameters: `startHeightMeters` (number, default `6`, range 2 to 10).

Source: manifest `type-ae7b919b937d.js`; view `visualization-972734b71299.js` → `KineticPotentialEnergyVisualization`.

#### Kinetic energy: `\mathrm{KE} = \frac{1}{2}mv^2`

Type `KINETIC_ENERGY` · manifest v2 · formula `\mathrm{KE} = \frac{1}{2}mv^2`, also `KE = \frac{1}{2}mv^2`, `K = \frac{1}{2}mv^2`, `KE = mv^2/2`, `K = mv^2/2`, `\frac{1}{2}mv^2 = KE`, `mv^2/2 = KE`.

Parameters: `mass` (number, default `5`, range 1 to 9); `velocity` (number, default `0`, range -10 to 10).

Source: manifest `type-e6de8eed347a.js`; view `visualization-77ab11428b41.js` → `KineticEnergyVisualization`.

#### Knn neighbor voting

Number of nearest neighbors

Type `KNN_NEIGHBOR_VOTING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d1d65447b667.js` → `KnnNeighborVotingVisualization`.

#### Labeled drum kit

Drum-kit component

Type `LABELED_DRUM_KIT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d76939aa3fba.js` → `LabeledDrumKitVisualization`.

#### Labor force flows

Type `LABOR_FORCE_FLOWS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-63fcca3f0393.js` → `LaborForceFlowsVisualization`.

#### Labor markets

Type `LABOR_MARKETS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d2c4565a6cd4.js` → `FactorMarketEquilibriumVisualization`.

#### Lac operon

Type `LAC_OPERON` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f7244de6148f.js` → `Visualization`.

#### Laffer curve

Type `LAFFER_CURVE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-91ba8f9f020f.js` → `Visualization`.

#### Land and sea breeze

Type `LAND_AND_SEA_BREEZE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f7afd1e86c10.js` → `Visualization`.

#### Landfill design

Water entry, from dry to heavy rainfall

Type `LANDFILL_DESIGN` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d345970e3414.js` → `Visualization`.

#### Landslide risk and movement types

Movement type

Type `LANDSLIDE_RISK_AND_MOVEMENT_TYPES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-fd0dc8c32d7e.js` → `Visualization`.

#### Latitude longitude

Type `LATITUDE_LONGITUDE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5b932d4d2838.js` → `Visualization`.

#### Law of cosines

Type `LAW_OF_COSINES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-30e6c7abec7e.js` → `LawOfCosinesVisualization`.

#### Law of definite proportions

Sample-size multiplier

Type `LAW_OF_DEFINITE_PROPORTIONS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-2ef7fef93cc8.js` → `LawOfDefiniteProportionsVisualization`.

#### Law of reflection

Type `LAW_OF_REFLECTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-93257daf5e31.js` → `LawOfReflectionVisualization`.

#### Lcm

Type `LCM` · manifest v4.

Parameters: `first_number` (integer, default `4`, range 1 to 12); `second_number` (integer, default `6`, range 1 to 12).

Source: manifest `type-afc86e267b1f.js`; view `visualization-1a70da605ca4.js` → `LcmVisualization`.

#### Ld50 dose response curve

Administered dose in milligrams per kilogram

Type `LD50_DOSE_RESPONSE_CURVE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-deec159ae545.js` → `Visualization`.

#### Le chateliers principle

Select the equilibrium stress

Type `LE_CHATELIERS_PRINCIPLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-bd0696bd7246.js` → `Visualization`.

#### Least square regression

Observed data points

Type `LEAST_SQUARE_REGRESSION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1cfda69f5108.js` → `LeastSquareRegressionVisualization`.

#### Lens equation: `\frac{1}{f} = \frac{1}{d_o} + \frac{1}{d_i}`

Type `LENS_EQUATION` · manifest v4 · formula `\frac{1}{f} = \frac{1}{d_o} + \frac{1}{d_i}`, also `\frac{1}{f} = \frac{1}{a} + \frac{1}{b}`, `1/f=1/do+1/di`, `1/f=1/di+1/do`, `1/f=1/b+1/a`, `1/do+1/di=1/f`, `1/di+1/do=1/f`, `1/a+1/b=1/f`, `1/b+1/a=1/f`.

Parameters: `objectDistance` (number, default `32`, range 0.01 to 10000); `focalLength` (number, default `16`, range -10000 to 10000).

Source: manifest `type-2b5f6faeedd9.js`; view `visualization-91664be5ef37.js` → `LensEquationVisualization`.

#### Levels of organization

Type `LEVELS_OF_ORGANIZATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c2c655c67598.js` → `Visualization`.

#### Lewis dot symbols

{name} ({symbol})

Type `LEWIS_DOT_SYMBOLS` · manifest v2.

Parameters: `element` (enum, default `C`, one of `H`, `He`, `Li`, `Be`, `B`, `C`, `N`, `O`, `F`, `Ne`, `Na`, `Mg`, `Al`, `Si`, `P`, `S`, `Cl`, `Ar`).

Source: manifest `type-84ec9bea3a73.js`; view `visualization-cd336bea44a3.js` → `Visualization`.

#### Lewis structure builder

Molecule or ion

Type `LEWIS_STRUCTURE_BUILDER` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-423d33571198.js` → `Visualization`.

#### Likelihood function: `L(p\mid k,n) \propto p^k(1-p)^{n-k}`

Observed successes

Type `LIKELIHOOD_FUNCTION` · manifest v3 · formula `L(p\mid k,n) \propto p^k(1-p)^{n-k}`.

Parameters: `successes` (integer, default `3`, range 0 to 48); `trials` (integer, default `12`, range 12 to 48).

Source: manifest `type-8c2ee062fabe.js`; view `visualization-3202f6e3a214.js` → `LikelihoodFunctionVisualization`.

#### Limiting reactant

Starting hydrogen molecules

Type `LIMITING_REACTANT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ba15760cd576.js` → `LimitingReactantVisualization`.

#### Linear combination: `\vec{w}=a\vec{u}+b\vec{v}`

Multiplier {multiplier} for vector {vector}

Type `LINEAR_COMBINATION` · manifest v2 · formula `\vec{w}=a\vec{u}+b\vec{v}`.

Parameters: `coefficientA` (number, default `1`, range -2 to 2); `coefficientB` (number, default `1`, range -2 to 2).

Source: manifest `type-f010dd668ee0.js`; view `visualization-687a87384a8b.js` → `LinearCombinationVisualization`.

#### Linear equation two vars simple

Type `LINEAR_EQUATION_TWO_VARS_SIMPLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-6f83e6be9c2e.js` → `LinearEquationTwoVarsSimpleVisualization`.

#### Linear independence discriminant: `A=\left|\det(\mathbf{u},\mathbf{v})\right|`

Type `LINEAR_INDEPENDENCE_DISCRIMINANT` · manifest v2 · formula `A=\left|\det(\mathbf{u},\mathbf{v})\right|`, also `\det(\mathbf{u},\mathbf{v})=u_xv_y-u_yv_x`, `\det(\mathbf{u},\mathbf{v})\ne 0`.

Parameters: `uX` (number, default `4`, range -20 to 20); `uY` (number, default `1`, range -20 to 20); `vX` (number, default `1`, range -20 to 20); `vY` (number, default `3`, range -20 to 20).

Source: manifest `type-630959edaee6.js`; view `visualization-2bfcee02b175.js` → `LinearIndependenceVisualization`.

#### Linear inequalities feasible region

Bounded feasible region preset

Type `LINEAR_INEQUALITIES_FEASIBLE_REGION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-31ce05f0f149.js` → `LinearInequalitiesFeasibleRegionVisualization`.

#### Linear inequality solution ray

Coefficient {a}

Type `LINEAR_INEQUALITY_SOLUTION_RAY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7e666f0feee4.js` → `LinearInequalitySolutionRayVisualization`.

#### Lipids and phospholipids

Type `LIPIDS_AND_PHOSPHOLIPIDS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5d0583776207.js` → `Visualization`.

#### Loanable funds

Type `LOANABLE_FUNDS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1da799ad4cc9.js` → `LoanableFundsVisualization`.

#### Logarithm inverse exponential

Type `LOGARITHM_INVERSE_EXPONENTIAL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-285ba273295a.js` → `LogarithmInverseExponentialVisualization`.

#### Logistic growth

Type `LOGISTIC_GROWTH` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-883e6a6ab2a1.js` → `LogisticGrowthVisualization`.

#### Logistic regression: `P(Y=1\mid x)=\frac{1}{1+e^{-(\beta_0+\beta_1x)}}`

Continuous predictor value

Type `LOGISTIC_REGRESSION` · manifest v3 · formula `P(Y=1\mid x)=\frac{1}{1+e^{-(\beta_0+\beta_1x)}}`.

Parameters: `intercept` (number, default `-0.5`, range -2 to 2); `coefficient` (number, default `1.2`, range -2.5 to 2.5).

Source: manifest `type-8875ae84811a.js`; view `visualization-929cee90b88e.js` → `LogisticRegressionVisualization`.

#### Long division

Type `LONG_DIVISION` · manifest v1.

Parameters: `dividend` (integer, default `458`, range 1 to 9999); `divisor` (integer, default `3`, range 1 to 99).

Source: manifest `type-eb0199ee4cef.js`; view `visualization-10d354b04cd8.js` → `LongDivisionVisualization`.

#### Long run growth

Type `LONG_RUN_GROWTH` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f8f6c014c83c.js` → `LongRunGrowthVisualization`.

#### Loop break control flow

Break condition outcome

Type `LOOP_BREAK_CONTROL_FLOW` · manifest v3.

Parameters: `loop_kind` (enum, default `for`, one of `for`, `while`); `loop_limit` (integer, default `5`, range 3 to 5); `break_value` (integer, default `2`, range 1 to 6).

Source: manifest `type-b7a8fbf7a420.js`; view `visualization-f900a53a50f2.js` → `LoopBreakControlFlowVisualization`.

#### Lorenz curve

Income inequality Gini coefficient

Type `LORENZ_CURVE` · manifest v4.

Parameters: `gini_coefficient` (number, default `0.33`, range 0 to 0.65); `population_share` (number, default `50`, range 0 to 100).

Source: manifest `type-a513a18b2ee6.js`; view `visualization-9151635b817b.js` → `LorenzCurveVisualization`.

#### Lras

Type `LRAS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-16920f1300fe.js` → `LrasVisualization`.

#### Lung gas gradient

Oxygen partial pressure in the alveolus

Type `LUNG_GAS_GRADIENT` · manifest v1.

Parameters: `alveolarOxygenPartialPressureMmHg` (number, default `100`, range 0 to 300); `bloodOxygenPartialPressureMmHg` (number, default `40`, range 0 to 300); `alveolarCarbonDioxidePartialPressureMmHg` (number, default `40`, range 0 to 150); `bloodCarbonDioxidePartialPressureMmHg` (number, default `45`, range 0 to 150).

Source: manifest `type-8a9437331f93.js`; view `visualization-5561bc0cf7a7.js` → `LungGasGradientVisualization`.

#### Lytic vs lysogenic virus cycle

Infection pathway

Type `LYTIC_VS_LYSOGENIC_VIRUS_CYCLE` · manifest v2.

Parameters: `initial_pathway` (enum, default `lytic`, one of `lytic`, `lysogenic`).

Source: manifest `type-ee3c6146db4d.js`; view `visualization-9e7b1236208e.js` → `VirusCycleVisualization`.

#### Magnet induced current

Magnet motion animation controls

Type `MAGNET_INDUCED_CURRENT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d19c751ebfa8.js` → `MagnetInducedCurrentVisualization`.

#### Magnet induced current direction

Type `MAGNET_INDUCED_CURRENT_DIRECTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-9c19f003aca4.js` → `MagnetInducedCurrentDirectionVisualization`.

#### Magnetic field direction on charge: `\vec F_B=q\vec v\times\vec B`

Velocity direction angle

Type `MAGNETIC_FIELD_DIRECTION_ON_CHARGE` · manifest v1 · formula `\vec F_B=q\vec v\times\vec B`.

Parameters: `velocityAngleDegrees` (number, default `0`, range 0 to 360); `fieldDirection` (enum, default `into-page`, one of `into-page`, `out-of-page`); `chargeSign` (enum, default `positive`, one of `positive`, `negative`).

Source: manifest `type-f09422f3bf66.js`; view `visualization-654e508bbe1a.js` → `MagneticFieldDirectionVisualization`.

#### Map measurement

{point} horizontal position

Type `MAP_MEASUREMENT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b8c0adfb7a16.js` → `MapMeasurementVisualization`.

#### Marginal analysis

Selected quantity

Type `MARGINAL_ANALYSIS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7995e645e5a1.js` → `MarginalAnalysisVisualization`.

#### Markovnikov alkene addition

HBr-addition step

Type `MARKOVNIKOV_ALKENE_ADDITION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-aadc700733fd.js` → `Visualization`.

#### Mass density volume relation: `\rho = \frac{m}{V}`

Type `MASS_DENSITY_VOLUME_RELATION` · manifest v4 · formula `\rho = \frac{m}{V}`, also `m = \rho V`, `rho = m / V`, `rho=m/v`, `d=m/v`, `m=rho v`, `m=dv`, `v=m/rho`, `v=m/d`, `m/v=rho`, `m/v=d`.

Parameters: `mass` (number, default `12`, range 0.01 to 10000); `volume` (number, default `5`, range 0.01 to 10000).

Source: manifest `type-18b6b503ca52.js`; view `visualization-e1e412e196cd.js` → `MassDensityVolumeRelationVisualization`.

#### Mass spectrum

Choose a mass-spectrum example

Type `MASS_SPECTRUM` · manifest v4.

Parameters: `example` (enum, default `fragment-dominant`, one of `fragment-dominant`, `molecular-ion-dominant`, `chlorine-isotope-pattern`, `bromine-isotope-pattern`).

Source: manifest `type-793044e0b754.js`; view `visualization-54c1f1bb6ec6.js` → `MassSpectrumVisualization`.

#### Mass spring shm: `T = 2\pi\sqrt{\frac{m}{k}}`

Mass-spring animation controls

Type `MASS_SPRING_SHM` · manifest v2 · formula `T = 2\pi\sqrt{\frac{m}{k}}`.

Parameters: `massKilograms` (number, default `1.5`, range 0.5 to 5); `springConstantNewtonsPerMeter` (number, default `40`, range 10 to 100); `amplitudeMeters` (number, default `0.25`, range 0.05 to 0.5).

Source: manifest `type-a880aebad1b1.js`; view `visualization-1055aee47d8f.js` → `MassSpringShmVisualization`.

#### Matched pairs design

Choose matched-pairs design variant

Type `MATCHED_PAIRS_DESIGN` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-881c7180f6e7.js` → `Visualization`.

#### Matrix inverse 2d: `A^{-1}A=I\quad A^{-1}Ax=x`

Type `MATRIX_INVERSE_2D` · manifest v1 · formula `A^{-1}A=I\quad A^{-1}Ax=x`.

Parameters: `matrixA` (number, default `0`, range -2 to 2); `matrixB` (number, default `1`, range -2 to 2); `matrixC` (number, default `-1`, range -2 to 2); `matrixD` (number, default `0`, range -2 to 2); `vectorX` (number, default `1`, range -5 to 5); `vectorY` (number, default `2`, range -5 to 5).

Source: manifest `type-654523ab98b5.js`; view `visualization-b2ff047558e0.js` → `MatrixInverseVisualization`.

#### Matrix multiplication row column rule

Type `MATRIX_MULTIPLICATION_ROW_COLUMN_RULE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-53d842acbc57.js` → `MatrixMultiplicationRowColumnRuleVisualization`.

#### Maxwell boltzmann distribution

Type `MAXWELL_BOLTZMANN_DISTRIBUTION` · manifest v4.

Parameters: `temperature_kelvin` (number, default `300`, range 200 to 800); `molar_mass_g_per_mol` (number, default `28`, range 4 to 80).

Source: manifest `type-f22c71cb1245.js`; view `visualization-20f67cf9baa5.js` → `MaxwellBoltzmannVisualization`.

#### Mean as balance point

Data set

Type `MEAN_AS_BALANCE_POINT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ff5603355f5e.js` → `MeanAsBalancePointVisualization`.

#### Mean value theorem

Type `MEAN_VALUE_THEOREM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-86ceaea48b91.js` → `MeanValueTheoremVisualization`.

#### Mean vs median

Type `MEAN_VS_MEDIAN` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-74bacfa52692.js` → `MeanVsMedianVisualization`.

#### Mediation indirect effect: `c = c^{\prime} + a \times b`

Path coefficient {a}, predictor {predictor} to mediator {mediator}

Type `MEDIATION_INDIRECT_EFFECT` · manifest v1 · formula `c = c^{\prime} + a \times b`.

Parameters: `a` (number, default `0.6`, range -1 to 1); `b` (number, default `0.5`, range -1 to 1); `directEffect` (number, default `0.2`, range -1 to 1).

Source: manifest `type-e52ae9a5f679.js`; view `visualization-b4c537ae010f.js` → `MediationIndirectEffectVisualization`.

#### Meiosis

Type `MEIOSIS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e93c512b3fa9.js` → `MeiosisVisualization`.

#### Meiosis nondisjunction

Type `MEIOSIS_NONDISJUNCTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-36057f1bc8e1.js` → `MeiosisNondisjunctionVisualization`.

#### Memory hierarchy

Level where the requested value is found

Type `MEMORY_HIERARCHY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-9f7655c186bf.js` → `Visualization`.

#### Menstrual cycle fertilization

No implantation

Type `MENSTRUAL_CYCLE_FERTILIZATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-2a4ee4e1d2d8.js` → `MenstrualCycleFertilizationVisualization`.

#### Merge sort

Input length

Type `MERGE_SORT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-92cc84c65f6b.js` → `MergeSortVisualization`.

#### Meta analysis

Focal study effect estimate

Type `META_ANALYSIS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-dab831c0431b.js` → `MetaAnalysisVisualization`.

#### Meta analysis forest weights

Type `META_ANALYSIS_FOREST_WEIGHTS` · manifest v1.

Parameters: `effect1` (number, default `-0.35`, range -0.8 to 0.8); `effect2` (number, default `-0.08`, range -0.8 to 0.8); `effect3` (number, default `0.18`, range -0.8 to 0.8); `effect4` (number, default `0.42`, range -0.8 to 0.8); `effect5` (number, default `0.1`, range -0.8 to 0.8); `weight1` (number, default `5`, range 2 to 24); `weight2` (number, default `12`, range 2 to 24); `weight3` (number, default `8`, range 2 to 24); `weight4` (number, default `18`, range 2 to 24); `weight5` (number, default `10`, range 2 to 24).

Source: manifest `type-72e940cb9aa1.js`; view `visualization-aaedd5ed44b9.js` → `MetaAnalysisForestWeightsVisualization`.

#### Metal reactivity series

Type `METAL_REACTIVITY_SERIES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-df00dd9bcf44.js` → `MetalReactivitySeriesVisualization`.

#### Metallic bonding

Type `METALLIC_BONDING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1f801faf34a6.js` → `Visualization`.

#### Metric distance

Type `METRIC_DISTANCE` · manifest v1.

Parameters: `lengthCm` (number, default `32`, range 10 to 50); `unit` (enum, default `cm`, one of `mm`, `cm`, `m`, `km`).

Source: manifest `type-aa70f27546d0.js`; view `visualization-7f5f51fff9b8.js` → `MetricDistanceVisualization`.

#### Mhc i vs mhc ii presentation

Antigen-presentation pathway

Type `MHC_I_VS_MHC_II_PRESENTATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1193f35458cd.js` → `MhcPresentationVisualization`.

#### Michaelis menten dynamics

Type `MICHAELIS_MENTEN_DYNAMICS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b648d4516fbf.js` → `MichaelisMentenDynamicsVisualization`.

#### Microbial tolerance curve

Microbial temperature group

Type `MICROBIAL_TOLERANCE_CURVE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ca9f74d9a99a.js` → `MicrobialToleranceCurveVisualization`.

#### Microphone polar patterns

Polar pattern

Type `MICROPHONE_POLAR_PATTERNS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c5ee237d47e0.js` → `Visualization`.

#### Midpoint formula

Type `MIDPOINT_FORMULA` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-27a84da1a82d.js` → `MidpointFormulaVisualization`.

#### Minimum wage

Type `MINIMUM_WAGE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-3aeedf782e4f.js` → `MinimumWageVisualization`.

#### Minor scale formula

Choose a tonic for the natural minor scale

Type `MINOR_SCALE_FORMULA` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7790b3ed553f.js` → `Visualization`.

#### Mirror equation: `\frac{1}{f} = \frac{1}{u} + \frac{1}{v}`

Type `MIRROR_EQUATION` · manifest v4 · formula `\frac{1}{f} = \frac{1}{u} + \frac{1}{v}`, also `\frac{1}{f} = \frac{1}{a} + \frac{1}{b}`, `1/f=1/v+1/u`, `1/f=1/b+1/a`, `1/u+1/v=1/f`, `1/v+1/u=1/f`, `1/a+1/b=1/f`, `1/b+1/a=1/f`.

Parameters: `objectDistance` (number, default `28`, range 0.01 to 10000); `focalLength` (number, default `14`, range -10000 to 10000).

Source: manifest `type-763c6e0ad6c9.js`; view `visualization-8f9f8d95cd5d.js` → `MirrorEquationVisualization`.

#### Mitosis

Type `MITOSIS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ad16202cc4ba.js` → `MitosisVisualization`.

#### Mixed numbers

Type `MIXED_NUMBERS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f506ffcaaffd.js` → `MixedNumbersVisualization`.

#### Mixing solutions: `C_{\mathrm{mix}}=\frac{C_1V_1+C_2V_2}{V_1+V_2}`

Type `MIXING_SOLUTIONS` · manifest v2 · formula `C_{\mathrm{mix}}=\frac{C_1V_1+C_2V_2}{V_1+V_2}`.

Parameters: `solution1VolumeLiters` (number, default `0.8`, range 0.01 to 1000); `solution1ConcentrationMolesPerLiter` (number, default `2`, range 0 to 20); `solution2VolumeLiters` (number, default `1.2`, range 0.01 to 1000); `solution2ConcentrationMolesPerLiter` (number, default `0.5`, range 0 to 20).

Source: manifest `type-cbd0267ff3a9.js`; view `visualization-b96f63f3a5e7.js` → `MixingSolutionsVisualization`.

#### Molarity moles per liter

Type `MOLARITY_MOLES_PER_LITER` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b65ec79c5f2d.js` → `MolarityMolesPerLiterVisualization`.

#### Mole avogadro number visual

Amount in moles

Type `MOLE_AVOGADRO_NUMBER_VISUAL` · manifest v1.

Parameters: `substance` (enum, default `copper`, one of `carbon`, `copper`, `water`); `initial_moles` (number, default `1`, range 0.25 to 5).

Source: manifest `type-bd9c85267933.js`; view `visualization-d52a8aad2fba.js` → `Visualization`.

#### Molecular polarity

Select a molecule comparison

Type `MOLECULAR_POLARITY` · manifest v2.

Parameters: `molecule` (enum, default `H2O`, one of `CO2`, `H2O`, `BF3`, `NH3`, `CCl4`, `CH3Cl`).

Source: manifest `type-8376aae4ceec.js`; view `visualization-28642d692786.js` → `Visualization`.

#### Momentum: `p = mv`

Type `MOMENTUM` · manifest v2 · formula `p = mv`, also `v = p/m`, `p=vm`, `mv=p`, `vm=p`, `m=p/v`.

Parameters: `m1` (number, default `4`, range 0.01 to 10000); `m2` (number, default `4`, range 0.01 to 10000); `v` (number, default `6`, range 0 to 10000).

Source: manifest `type-85baef7164cd.js`; view `visualization-16071f02614d.js` → `MomentumVisualization`.

#### Monetary policy

Type `MONETARY_POLICY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-2c0a26d3e4cf.js` → `Visualization`.

#### Money market

Type `MONEY_MARKET` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1fbee33f7379.js` → `MoneyMarketVisualization`.

#### Monopolistic competition

Type `MONOPOLISTIC_COMPETITION` · manifest v3.

Parameters: `entry_progress` (number, default `100`, range 0 to 100).

Source: manifest `type-1d713bfd423d.js`; view `visualization-736e43029171.js` → `MonopolisticCompetitionVisualization`.

#### Monopoly inefficiency

Highlighted benchmark

Type `MONOPOLY_INEFFICIENCY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-6e7eed779415.js` → `MonopolyInefficiencyVisualization`.

#### Monopoly pricing

Type `MONOPOLY_PRICING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b69778a9b898.js` → `MonopolyProfitVisualization`.

#### Monopsony labor market power

Monopsony labor market graph. Monopsony employment is {lm} and wage is {wm}; competitive employment is {lc} and wage is {wc}.

Type `MONOPSONY_LABOR_MARKET_POWER` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ba4f87b3c663.js` → `MonopsonyLaborMarketPowerVisualization`.

#### Moon phases

Type `MOON_PHASES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-785d15f3f43f.js` → `MoonPhasesVisualization`.

#### Mosaic plot

Type `MOSAIC_PLOT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d458cc7832df.js` → `Visualization`.

#### Mrna translation

Type `MRNA_TRANSLATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-9f808d2ab532.js` → `MrnaTranslationVisualization`.

#### Multiplication as repeated addition

Type `MULTIPLICATION_AS_REPEATED_ADDITION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5bcf21f7294d.js` → `Visualization`.

#### Musical harmonic series

Selected partial

Type `MUSICAL_HARMONIC_SERIES` · manifest v3.

Parameters: `fundamental_frequency_hz` (number, default `220`, range 20 to 2000).

Source: manifest `type-6bf72910493c.js`; view `visualization-b0fe88f11319.js` → `Visualization`.

#### Musical interval chart

Interval number

Type `MUSICAL_INTERVAL_CHART` · manifest v4.

Parameters: `lower_note` (enum, default `C`, one of `C`, `C-sharp`, `D-flat`, `D`, `E-flat`, `E`, `F`, `F-sharp`, `G-flat`, `G`, `A-flat`, `A`, `B-flat`, `B`).

Source: manifest `type-d4074e9cd37d.js`; view `visualization-e0df258a6761.js` → `Visualization`.

#### Mutation types

Type `MUTATION_TYPES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a36061138318.js` → `MutationTypesVisualization`.

#### Myopia

Object distance from the eye

Type `MYOPIA` · manifest v2.

Parameters: `objectDistanceMeters` (number, default `6`, range 0.25 to 6).

Source: manifest `type-d92a49fbb130.js`; view `visualization-40f5a1f1a632.js` → `MyopiaVisualization`.

#### Natural monopoly

Choose fair-return pricing

Type `NATURAL_MONOPOLY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-862126040b84.js` → `NaturalMonopolyVisualization`.

#### Natural selection allele frequency

Type `NATURAL_SELECTION_ALLELE_FREQUENCY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-33c7d62b4196.js` → `NaturalSelectionAlleleFrequencyVisualization`.

#### Negative feedback loop

Negative-feedback stage

Type `NEGATIVE_FEEDBACK_LOOP` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-6040807af78f.js` → `NegativeFeedbackVisualization`.

#### Nephron

Filtrate pathway stage

Type `NEPHRON` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-17e07659cee3.js` → `NephronVisualization`.

#### Nernst equation

log ten Q

Type `NERNST_EQUATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-eca0cef4dd00.js` → `NernstEquationVisualization`.

#### Net ionic equations

Choose an aqueous reaction

Type `NET_IONIC_EQUATIONS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-dec5402b4126.js` → `Visualization`.

#### Network fault tolerance

Packet delivery from A to B

Type `NETWORK_FAULT_TOLERANCE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-94d518996244.js` → `NetworkFaultToleranceVisualization`.

#### Newman projections

Molecule

Type `NEWMAN_PROJECTIONS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1883e1a480e3.js` → `NewmanProjectionVisualization`.

#### Newton first law

Type `NEWTON_FIRST_LAW` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-dc9c70cb0599.js` → `NewtonFirstLawVisualization`.

#### Newton second law: `F_{\mathrm{net}} = ma`

Type `NEWTON_SECOND_LAW` · manifest v3 · formula `F_{\mathrm{net}} = ma`, also `F=ma`, `a=F/m`, `m=F/a`.

Parameters: `netForceNewtons` (number, default `8`, range 2 to 12); `massKilograms` (number, default `2`, range 1 to 4).

Source: manifest `type-5028a1c12442.js`; view `visualization-9b6d820c3864.js` → `NewtonSecondLawVisualization`.

#### Newton third law

Type `NEWTON_THIRD_LAW` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-444aa3884e34.js` → `NewtonThirdLawVisualization`.

#### Newtons gravitation law

Type `NEWTONS_GRAVITATION_LAW` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-62d1288578d6.js` → `NewtonsGravitationLawVisualization`.

#### Nitrogen cycle

Nitrogen-cycle process

Type `NITROGEN_CYCLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ee358d0c8585.js` → `NitrogenCycleVisualization`.

#### Normal approximation to binomial

Integer success count k

Type `NORMAL_APPROXIMATION_TO_BINOMIAL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c3820583e6ce.js` → `NormalApproximationVisualization`.

#### Nuclear decay modes

{mode}: parent {parentMass} {parentSymbol} becomes daughter {daughterMass} {daughterSymbol}; {radiation}. Mass number changes by {massChange}, atomic number by {atomicChange}, protons by {protonChange}, and neutrons by {neutronChange}.

Type `NUCLEAR_DECAY_MODES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-9767598cd914.js` → `Visualization`.

#### Nuclear fission

Fission-chain outcome

Type `NUCLEAR_FISSION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b960b4a21002.js` → `Visualization`.

#### Nuclear fusion

Fusion reaction stage

Type `NUCLEAR_FUSION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5af709fcf5e1.js` → `Visualization`.

#### Nuclear power plant

Type `NUCLEAR_POWER_PLANT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a8806a34ca27.js` → `Visualization`.

#### Nucleotides dna and rna

Select DNA or RNA

Type `NUCLEOTIDES_DNA_AND_RNA` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-33c40ce165b9.js` → `Visualization`.

#### Obtuse triangle

Type `OBTUSE_TRIANGLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-6066038700a6.js` → `ObtuseTriangleVisualization`.

#### Ocean acidification

Atmospheric carbon dioxide

Type `OCEAN_ACIDIFICATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-62512bcd9056.js` → `OceanAcidificationVisualization`.

#### Ogive

Cumulative-frequency graph for {total} grouped rent observations. The current class from {classLower} to {classUpper} adds {frequencyCount, plural, one {{frequency} observation} other {{frequency} observations}}, so the curve {slope}. Below {threshold}, about {countCount, plural, one {{count} observation} other {{count} observations}} or {percent} accumulate. At {percentile}, the estimated rent is {value}. Two empty classes keep the curve level near the top.

Type `OGIVE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b94a364a2754.js` → `OgiveVisualization`.

#### Ohms law: `I = \frac{V}{R}`

Type `OHMS_LAW` · manifest v3 · formula `I = \frac{V}{R}`, also `V = IR`, `V = I \cdot R`, `V = I \times R`, `\Delta V = IR`, `u = ri`, `v=ri`, `ir=v`, `ri=v`, `i=\Delta V/R`, `i=(1/r)v`, `i=v(1/r)`, `i=1/r(v)`, `r=v/i`, `r=\Delta V/i`, `ri=u`, `i=u/r`, `i=(1/r)u`, `i=u(1/r)`, `i=1/r(u)`, `r=u/i`, `i=(v-v)/r`, `(v-v)/r=i`, `r=(v-v)/i`, `(v-v)/i=r`.

Parameters: `voltage` (number, default `12`, range 0 to 1000); `resistance` (number, default `6`, range 0.1 to 100000).

Source: manifest `type-4b769e1efbb8.js`; view `visualization-b95c4e4c6db1.js` → `OhmsLawVisualization`.

#### Oil spill fate

Elapsed time after spill

Type `OIL_SPILL_FATE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-80df3f199b6f.js` → `OilSpillFateVisualization`.

#### Okuns law

Output gap relative to potential output

Type `OKUNS_LAW` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-fcf240f15103.js` → `OkunsLawVisualization`.

#### One sample t test

Observed sample mean

Type `ONE_SAMPLE_T_TEST` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-bd8ca10e2bc1.js` → `OneSampleTTestVisualization`.

#### Operant conditioning

Type `OPERANT_CONDITIONING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-2d8afa5e407f.js` → `OperantConditioningVisualization`.

#### Orbital shapes

Select an atomic subshell

Type `ORBITAL_SHAPES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d803d141c9ed.js` → `Visualization`.

#### Orchestra seating

Type `ORCHESTRA_SEATING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b66559039450.js` → `Visualization`.

#### Osmosis

Type `OSMOSIS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5318b9d7e205.js` → `OsmosisVisualization`.

#### Osmotic pressure: `\pi = i c R T`

Solute concentration

Type `OSMOTIC_PRESSURE` · manifest v3 · formula `\pi = i c R T`.

Parameters: `solute_concentration_molar` (number, default `0.2`, range 0.05 to 0.5); `vant_hoff_factor` (number, default `2`, range 1 to 3); `temperature_kelvin` (number, default `298`, range 273 to 323).

Source: manifest `type-3a57bdeab4d8.js`; view `visualization-b51e3e60099e.js` → `Visualization`.

#### Outlier leverage influence

Choose a starting regression case

Type `OUTLIER_LEVERAGE_INFLUENCE` · manifest v3.

Parameters: `initial_case` (enum, default `influential`, one of `central-outlier`, `aligned-high-leverage`, `influential`).

Source: manifest `type-d42397bb5e22.js`; view `visualization-2b5b0d5a45a3.js` → `Visualization`.

#### Oxygen sag curve

Oxygen-sag plot. Remaining biochemical oxygen demand falls downstream. Dissolved oxygen falls to {minimumCount, plural, one {{minimum} milligram per liter} other {{minimum} milligrams per liter}} after {timeCount, plural, one {{time} day} other {{time} days}}, then recovers toward the {saturation} milligrams per liter saturation reference. At the critical minimum, oxygen deficit is {deficitCount, plural, one {{deficit} milligram per liter} other {{deficit} milligrams per liter}} and deoxygenation equals reaeration.

Type `OXYGEN_SAG_CURVE` · manifest v4.

Parameters: `initial_ultimate_bod_mg_l` (number, default `9`, range 4 to 14); `initial_oxygen_deficit_mg_l` (number, default `0.25`, range 0 to 0.5); `deoxygenation_rate_per_day` (number, default `0.25`, range 0.15 to 0.35); `reaeration_rate_per_day` (number, default `0.75`, range 0.35 to 1.15).

Source: manifest `type-523f134bfeb2.js`; view `visualization-ab7c3350d33d.js` → `Visualization`.

#### P series threshold: `\sum_{n=1}^{\infty}\frac{1}{n^p}`

Exponent p

Type `P_SERIES_THRESHOLD` · manifest v3 · formula `\sum_{n=1}^{\infty}\frac{1}{n^p}`.

Parameters: `p` (number, default `1`, range 0.6 to 1.4); `termCount` (integer, default `12`, range 4 to 30).

Source: manifest `type-ede084b98a92.js`; view `visualization-c0c0e2ae1e69.js` → `PSeriesThresholdVisualization`.

#### Paired t test

Common after-minus-before change

Type `PAIRED_T_TEST` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a426d60bc92e.js` → `PairedTTestVisualization`.

#### Parallel line

{lineName} crosses the y-axis at {intercept}.

Type `PARALLEL_LINE` · manifest v2.

Parameters: `slope` (number, default `0.6`, range -1 to 1); `referenceIntercept` (number, default `0`, range -4 to 4); `comparisonIntercept` (number, default `3`, range -4 to 4).

Source: manifest `type-5ace481a4856.js`; view `visualization-306df547ba14.js` → `ParallelLineVisualization`.

#### Parametrized line 2d

Curve parameter {parameter}

Type `PARAMETRIZED_LINE_2D` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d54c3fcd0614.js` → `ParametrizedLine2DVisualization`.

#### Particulate matter size

Type `PARTICULATE_MATTER_SIZE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a1ef2a925738.js` → `ParticulateMatterSizeVisualization`.

#### Pascals law hydraulics: `p = \frac{F}{A}`

Input force

Type `PASCALS_LAW_HYDRAULICS` · manifest v2 · formula `p = \frac{F}{A}`.

Parameters: `inputForceNewtons` (number, default `100`, range 20 to 200); `inputAreaSquareCentimeters` (number, default `10`, range 5 to 25); `outputAreaSquareCentimeters` (number, default `50`, range 25 to 100).

Source: manifest `type-9d02b768e9bf.js`; view `visualization-be4c644f6103.js` → `PascalsLawHydraulicsVisualization`.

#### Pcr cycle

Type `PCR_CYCLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b8e3330be4fe.js` → `PcrCycleVisualization`.

#### Pedigree

Inheritance example

Type `PEDIGREE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f43a8d9dfad6.js` → `PedigreeVisualization`.

#### Percent part whole proportion

Type `PERCENT_PART_WHOLE_PROPORTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a3fae81be119.js` → `PercentPartWholeProportionVisualization`.

#### Perfect competition

Type `PERFECT_COMPETITION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7bd22ad6d782.js` → `LongRunCompetitiveEquilibriumVisualization`.

#### Perfect competition market firm

Type `PERFECT_COMPETITION_MARKET_FIRM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a03afe2c4381.js` → `PerfectCompetitionMarketFirmVisualization`.

#### Period frequency relation: `f = \frac{1}{T}`

Type `PERIOD_FREQUENCY_RELATION` · manifest v2 · formula `f = \frac{1}{T}`, also `T = \frac{1}{f}`, `T = 1 / f`, `1/t=f`, `1/f=t`, `t=2pi/omega`, `2pi/omega=t`, `tau=60/nz`, `60/nz=tau`.

Parameters: `period` (number, default `2`, range 0.01 to 1000).

Source: manifest `type-af2e2029147a.js`; view `visualization-496a487b36da.js` → `PeriodFrequencyRelationVisualization`.

#### Periodic table explorer

Type `PERIODIC_TABLE_EXPLORER` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-3e3204c0afbf.js` → `PeriodicTableVisualization`.

#### Periodic trends

Type `PERIODIC_TRENDS` · manifest v2.

Parameters: `initial_trend` (enum, default `atomic radius`, one of `atomic radius`, `first ionization energy`, `electronegativity`).

Source: manifest `type-5d4a85edaa4f.js`; view `visualization-c4edaac7fab8.js` → `Visualization`.

#### Permutation formula

Type `PERMUTATION_FORMULA` · manifest v3.

Parameters: `n` (integer, default `6`, range 4 to 8); `r` (integer, default `3`, range 2 to 4).

Source: manifest `type-1af4bc023ce6.js`; view `visualization-3351ec94519f.js` → `PermutationFormulaVisualization`.

#### Permutations vs combinations

Type `PERMUTATIONS_VS_COMBINATIONS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f05419341469.js` → `PermutationsVsCombinationsVisualization`.

#### Perpendicular line

Type `PERPENDICULAR_LINE` · manifest v4.

Parameters: `slope` (number, default `2`, range -10000 to 10000); `intercept` (number, default `1`, range -10000 to 10000); `perpendicularIntercept` (number, default `-2`, range -10000 to 10000).

Source: manifest `type-edfc78ae68b7.js`; view `visualization-af3dcef57f05.js` → `PerpendicularLineVisualization`.

#### Pesticide treadmill

Pesticide treadmill stage

Type `PESTICIDE_TREADMILL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-67b7c7f8b3c3.js` → `PesticideTreadmillVisualization`.

#### Ph from concentration: `\mathrm{pH}=-\log_{10}([\mathrm{H_3O^+}])`

Hydronium concentration in moles per liter

Type `PH_FROM_CONCENTRATION` · manifest v2 · formula `\mathrm{pH}=-\log_{10}([\mathrm{H_3O^+}])`.

Parameters: `hydronium_concentration_molar` (number, default `1e-7`, range 1e-12 to 0.01).

Source: manifest `type-5afefdccef0f.js`; view `visualization-3ff1a9fb8732.js` → `PhFromConcentrationVisualization`.

#### Pharmacokinetic curve

Type `PHARMACOKINETIC_CURVE` · manifest v4.

Parameters: `dose_mg` (number, default `240`, range 80 to 400); `elimination_half_life_hours` (number, default `6`, range 2 to 10); `minimum_effective_concentration` (number, default `1.5`, range 0.8 to 2.5); `minimum_toxic_concentration` (number, default `5.5`, range 4 to 8).

Source: manifest `type-a0444b690340.js`; view `visualization-6187c9dda15f.js` → `PharmacokineticCurveVisualization`.

#### Phase change cycle

Phase change

Type `PHASE_CHANGE_CYCLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8783e33542c2.js` → `PhaseChangeCycleVisualization`.

#### Phase diagram

Type `PHASE_DIAGRAM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-26fa65038781.js` → `PhaseDiagramVisualization`.

#### Phillips curve

Aggregate demand strength

Type `PHILLIPS_CURVE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e51eeb60b5e4.js` → `PhillipsCurveVisualization`.

#### Phillips curve shifts

Type `PHILLIPS_CURVE_SHIFTS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ffb76cba2c57.js` → `PhillipsCurveShiftsVisualization`.

#### Phosphorus cycle

Phosphorus-cycle process

Type `PHOSPHORUS_CYCLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-3a71ed21487f.js` → `PhosphorusCycleVisualization`.

#### Photochemical smog

Time of day

Type `PHOTOCHEMICAL_SMOG` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-0c1e59ce449f.js` → `PhotochemicalSmogVisualization`.

#### Photoelectric energy balance: `hf = \phi + K_{\max}`

Light frequency

Type `PHOTOELECTRIC_ENERGY_BALANCE` · manifest v1 · formula `hf = \phi + K_{\max}`.

Parameters: `frequencyTimes10To14Hertz` (number, default `8`, range 3 to 15); `intensityPercent` (number, default `50`, range 10 to 100); `workFunctionElectronVolts` (number, default `2.3`, range 1.5 to 6).

Source: manifest `type-389cfab21292.js`; view `visualization-73b09fccd75a.js` → `PhotoelectricEnergyBalanceVisualization`.

#### Photoelectron spectrum

Select an element

Type `PHOTOELECTRON_SPECTRUM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5b29aa570e96.js` → `Visualization`.

#### Photosynthesis

{label} value

Type `PHOTOSYNTHESIS` · manifest v4.

Parameters: `lightIntensity` (enum, default `low`, one of `low`, `medium`, `high`); `carbonDioxide` (enum, default `low`, one of `low`, `medium`, `high`); `water` (enum, default `low`, one of `low`, `medium`, `high`).

Source: manifest `type-b4bcce60d760.js`; view `visualization-b90368c40c85.js` → `PhotosynthesisVisualization`.

#### Photosynthesis overview

Photosynthesis stage focus

Type `PHOTOSYNTHESIS_OVERVIEW` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5ebe75e08815.js` → `PhotosynthesisOverviewVisualization`.

#### Photosynthetic pigment spectrum

Visible-light wavelength in nanometres

Type `PHOTOSYNTHETIC_PIGMENT_SPECTRUM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f57117711488.js` → `PhotosyntheticPigmentSpectrumVisualization`.

#### Phototropism

Phototropism response stage

Type `PHOTOTROPISM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-2e939439b472.js` → `Visualization`.

#### Phylogenetic tree

{first} and {second}

Type `PHYLOGENETIC_TREE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c8b8b387d4c1.js` → `Visualization`.

#### Physical vs chemical process

Examples

Type `PHYSICAL_VS_CHEMICAL_PROCESS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c283d19d658e.js` → `Visualization`.

#### Piano chord chart

Chord root family

Type `PIANO_CHORD_CHART` · manifest v2.

Parameters: `root_note` (enum, default `C`, one of `C`, `Db`, `D`, `Eb`, `E`, `F`, `F#`, `G`, `Ab`, `A`, `Bb`, `B`); `quality` (enum, default `major`, one of `major`, `minor`).

Source: manifest `type-f409ad2953b1.js`; view `visualization-105eaff600c9.js` → `Visualization`.

#### Piano keyboard note names

Selected piano key

Type `PIANO_KEYBOARD_NOTE_NAMES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-43fe5569dab6.js` → `Visualization`.

#### Piano roll

Type `PIANO_ROLL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c31bbe238b74.js` → `PianoRollVisualization`.

#### Place value

Whole number

Type `PLACE_VALUE` · manifest v2.

Parameters: `number` (integer, default `2654`, range 0 to 9999).

Source: manifest `type-3be9f9a369b1.js`; view `visualization-5fd557e48967.js` → `PlaceValueVisualization`.

#### Plant anatomy

Plant organ

Type `PLANT_ANATOMY` · manifest v2.

Parameters: `initial_organ` (enum, default `root`, one of `root`, `stem`, `leaf`); `initial_transport_tissue` (enum, default `xylem`, one of `xylem`, `phloem`).

Source: manifest `type-a2c1e373aef7.js`; view `visualization-8bcb83567555.js` → `Visualization`.

#### Plant life cycle

Plant life-cycle stage

Type `PLANT_LIFE_CYCLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1498d37617b3.js` → `PlantLifeCycleVisualization`.

#### Plant vs animal cell

Type `PLANT_VS_ANIMAL_CELL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d05dc75d9434.js` → `Visualization`.

#### Plate boundaries

Plate boundary type

Type `PLATE_BOUNDARIES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-eb326feb4c9b.js` → `Visualization`.

#### Point slope line: `y - y_1 = m(x - x_1)`

Type `POINT_SLOPE_LINE` · manifest v2 · formula `y - y_1 = m(x - x_1)`.

Parameters: `x1` (number, default `-3`, range -100 to 100); `y1` (number, default `-2`, range -100 to 100); `slope` (number, default `0.75`, range -20 to 20).

Source: manifest `type-27959fdf7d51.js`; view `visualization-1d354a4a5cb9.js` → `PointSlopeLineVisualization`.

#### Point to plane distance: `d = PH`

Type `POINT_TO_PLANE_DISTANCE` · manifest v2 · formula `d = PH`.

Parameters: `pointX` (number, default `1.5`, range -3 to 3); `pointY` (number, default `4`, range 2 to 5.5); `planeAngleDegrees` (number, default `-10`, range -25 to 25).

Source: manifest `type-96ed8dbb8a85.js`; view `visualization-a04f447b76bf.js` → `PointToPlaneDistanceVisualization`.

#### Polar curves

Type `POLAR_CURVES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-437f82723a77.js` → `PolarCurvesVisualization`.

#### Polar double integral

Type `POLAR_DOUBLE_INTEGRAL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-eefbac0c6a6a.js` → `PolarDoubleIntegralVisualization`.

#### Polygon interior angle sum: `(n - 2)\times 180^\circ`

Type `POLYGON_INTERIOR_ANGLE_SUM` · manifest v2 · formula `(n - 2)\times 180^\circ`, also `(n - 2) \times 180^\circ`, `S_n = (n - 2) \cdot 180^\circ`, `S_n = (n - 2)(180^\circ)`, `S_n=(n-2)\cdot(180)`, `180^\circ(n-2)`.

Parameters: `n` (number, default `6`, range 3 to 50).

Source: manifest `type-e574ac8a1abb.js`; view `visualization-132cc094a45b.js` → `PolygonInteriorAngleSumVisualization`.

#### Polymerization

Alkene monomer

Type `POLYMERIZATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-482977f08189.js` → `Visualization`.

#### Polynomial multiplicity intercepts

Type `POLYNOMIAL_MULTIPLICITY_INTERCEPTS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5fc6e4f2a624.js` → `PolynomialMultiplicityInterceptsVisualization`.

#### Polyprotic titration

Equivalents of strong base added

Type `POLYPROTIC_TITRATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-36a44309959c.js` → `Visualization`.

#### Population density

Population

Type `POPULATION_DENSITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-75f8d73bd5c7.js` → `PopulationDensityVisualization`.

#### Positive externality

Marginal external benefit

Type `POSITIVE_EXTERNALITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c375727319f2.js` → `PositiveExternalityVisualization`.

#### Positive feedback loop

Feedback example

Type `POSITIVE_FEEDBACK_LOOP` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4e9fb2e76e15.js` → `PositiveFeedbackVisualization`.

#### Ppc growth

Type `PPC_GROWTH` · manifest v2.

Parameters: `capacity_change_percent` (number, default `15`, range -40 to 30).

Source: manifest `type-358342ea04f6.js`; view `visualization-8fd0d1bcb78e.js` → `PpcGrowthVisualization`.

#### Ppc opportunity cost

Type `PPC_OPPORTUNITY_COST` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-79d72169ce5e.js` → `Visualization`.

#### Precipitation reactions

Reactants

Type `PRECIPITATION_REACTIONS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-6c6d17061ecc.js` → `PrecipitationReactionsVisualization`.

#### Predator prey cycle

Predator-prey cycle phase

Type `PREDATOR_PREY_CYCLE` · manifest v3.

Parameters: `population_pair` (enum, default `hare-and-lynx`, one of `hare-and-lynx`, `rabbit-and-fox`, `generic-prey-and-predator`).

Source: manifest `type-3465f183219c.js`; view `visualization-da5f74bedefb.js` → `PredatorPreyCycleVisualization`.

#### Predator prey dynamics

Starting balance

Type `PREDATOR_PREY_DYNAMICS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e8d92bdbdbeb.js` → `PredatorPreyVisualization`.

#### Presbyopia

Type `PRESBYOPIA` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-68d5124ea084.js` → `PresbyopiaVisualization`.

#### Present value discounting

Type `PRESENT_VALUE_DISCOUNTING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4bb6c1b97e75.js` → `PresentValueDiscountingVisualization`.

#### Pressure: `P = \frac{F}{A}`

Type `PRESSURE` · manifest v2 · formula `P = \frac{F}{A}`, also `P = F/A`, `F = PA`, `A = F/P`.

Parameters: `forceNewtons` (number, default `100`, range 0 to 200); `areaSquareMeters` (number, default `2`, range 0.25 to 5).

Source: manifest `type-e210bd3bc009.js`; view `visualization-85c592a9fc92.js` → `PressureVisualization`.

#### Price ceilings and floors

Type `PRICE_CEILINGS_AND_FLOORS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-afc41ec876f5.js` → `PriceCeilingsAndFloorsVisualization`.

#### Price discrimination

Pricing mode

Type `PRICE_DISCRIMINATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-9d1213cfd5bd.js` → `PriceDiscriminationVisualization`.

#### Primary vs secondary pollutants

Formation pathway

Type `PRIMARY_VS_SECONDARY_POLLUTANTS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a7ee5499301d.js` → `PrimaryVsSecondaryPollutantsVisualization`.

#### Primes

Type `PRIMES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-2df93bdfaecc.js` → `PrimesVisualization`.

#### Probability intersection

Type `PROBABILITY_INTERSECTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d0b3e5a86170.js` → `ProbabilityIntersectionVisualization`.

#### Probability tree

Choose sampling mode

Type `PROBABILITY_TREE` · manifest v2.

Parameters: `first_outcome_count` (integer, default `3`, range 1 to 12); `second_outcome_count` (integer, default `8`, range 1 to 12); `with_replacement` (boolean, default `false`).

Source: manifest `type-bb80ea70b787.js`; view `visualization-d8973bd8b278.js` → `ProbabilityTreeVisualization`.

#### Process capability cp cpk

Process mean

Type `PROCESS_CAPABILITY_CP_CPK` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5f8b4a4357a7.js` → `ProcessCapabilityVisualization`.

#### Production function

Type `PRODUCTION_FUNCTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f61b8f67690b.js` → `ProductionFunctionVisualization`.

#### Production possibilities frontier

Type `PRODUCTION_POSSIBILITIES_FRONTIER` · manifest v5.

Parameters: `wheat` (number, default `4`, range 0 to 9); `computers` (number, default `4`, range 0 to 9).

Source: manifest `type-f06e3a1bfe5a.js`; view `visualization-6594dd6d019a.js` → `Visualization`.

#### Projectile motion

Type `PROJECTILE_MOTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-433ff4deff70.js` → `ProjectileMotionVisualization`.

#### Prokaryotic vs eukaryotic cells

Select a cell feature focus

Type `PROKARYOTIC_VS_EUKARYOTIC_CELLS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f7de97463a8a.js` → `Visualization`.

#### Protein denaturation

Environmental stress

Type `PROTEIN_DENATURATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c2597f83e8d6.js` → `ProteinDenaturationVisualization`.

#### Protein structure levels

Protein structure level

Type `PROTEIN_STRUCTURE_LEVELS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c417f40dca77.js` → `ProteinStructureVisualization`.

#### Proton nmr splitting

Select the number of equivalent neighboring protons

Type `PROTON_NMR_SPLITTING` · manifest v3.

Parameters: `neighbor_count` (enum, default `2`, one of `0`, `1`, `2`, `3`, `4`, `6`).

Source: manifest `type-ec08a0c3755f.js`; view `visualization-4a9ea3c28f7c.js` → `Visualization`.

#### Pulmonary surfactant and compliance

Lung condition

Type `PULMONARY_SURFACTANT_AND_COMPLIANCE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a994423d64c7.js` → `Visualization`.

#### Punnett squares

Type `PUNNETT_SQUARES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4a23c35cf0a5.js` → `PunnettSquareVisualization`.

#### Pupillary light reflex

Type `PUPILLARY_LIGHT_REFLEX` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-2683734a8bbd.js` → `PupillaryLightReflexVisualization`.

#### Pv nrt equation: `PV = nRT`

Type `PV_NRT_EQUATION` · manifest v4 · formula `PV = nRT`, also `P V = n R T`, `P = nRT / V`, `P = \frac{nRT}{V}`, `V = nRT / P`, `V = \frac{nRT}{P}`, `n = PV / RT`, `n = \frac{PV}{RT}`, `T = PV / nR`, `T = \frac{PV}{nR}`, `R = PV / nT`, `R = \frac{PV}{nT}`.

Parameters: `P` (number, default `1`, range 0.01 to 100); `V` (number, default `24`, range 0.01 to 10000); `n` (number, default `1`, range 0.01 to 1000); `T` (number, default `298`, range 1 to 5000); `solveFor` (enum, default `P`, one of `P`, `V`, `n`, `T`).

Source: manifest `type-545469cf1dee.js`; view `visualization-3bfd5b87bae4.js` → `PVNRTVisualization`.

#### Pythagorean theorem: `a^2 + b^2 = c^2`

Type `PYTHAGOREAN_THEOREM` · manifest v4 · formula `a^2 + b^2 = c^2`, also `c^2 = a^2 + b^2`, `c = \sqrt{a^2 + b^2}`, `c = \sqrt{(a^2 + b^2)}`.

Parameters: `a` (number, default `15`, range 0.01 to 10000); `b` (number, default `15`, range 0.01 to 10000).

Source: manifest `type-8d5332dc0d4a.js`; view `visualization-785844b8dee6.js` → `PythagoreanVisualization`.

#### Python range for loop

Type `PYTHON_RANGE_FOR_LOOP` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5eb765c4186a.js` → `PythonRangeForLoopVisualization`.

#### Q vs k

Q is less than K

Type `Q_VS_K` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-80475393480d.js` → `QVsKVisualization`.

#### Qt prolongation torsades

Corrected QT interval

Type `QT_PROLONGATION_TORSADES` · manifest v2.

Parameters: `qtcMs` (number, default `420`, range 360 to 560).

Source: manifest `type-2cfafbf12fe5.js`; view `visualization-76de2654dc78.js` → `QTProlongationV2Visualization`.

#### Quadratic formula: `x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`

Type `QUADRATIC_FORMULA` · manifest v4 · formula `x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`, also `x = (-b \pm \sqrt{b^2 - 4ac})/(2a)`.

Parameters: `a` (number, default `1`, range -5 to 5); `b` (number, default `0`, range -5 to 5); `c` (number, default `-4`, range -5 to 5).

Source: manifest `type-46bd62c7daa0.js`; view `visualization-fb308780d5fc.js` → `QuadraticFormulaVisualization`.

#### Quadratic inequalities

{operator} zero

Type `QUADRATIC_INEQUALITIES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-cbbd72b543f7.js` → `QuadraticInequalitiesVisualization`.

#### Quadratic vertex form

Type `QUADRATIC_VERTEX_FORM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-579b9d68d02f.js` → `QuadraticVertexFormVisualization`.

#### Quicksort

Starting arrangement

Type `QUICKSORT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-71d3621a0de8.js` → `QuicksortVisualization`.

#### Raas and adh

RAAS and ADH causal stage

Type `RAAS_AND_ADH` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4a3d0e27389e.js` → `Visualization`.

#### Radiation penetration

Shielding stage

Type `RADIATION_PENETRATION` · manifest v2.

Parameters: `initial_shielding` (enum, default `lead-or-concrete`, one of `none`, `paper`, `aluminium-or-plastic`, `lead-or-concrete`).

Source: manifest `type-7a83abf1c6c4.js`; view `visualization-d0bba17d6c69.js` → `RadiationPenetrationVisualization`.

#### Radiometric dating

Type `RADIOMETRIC_DATING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5a3c61867f27.js` → `RadiometricDatingVisualization`.

#### Rain shadow effect

Type `RAIN_SHADOW_EFFECT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5f224ad8ed52.js` → `RainShadowVisualization`.

#### Randomized controlled trial flow

Trial phase

Type `RANDOMIZED_CONTROLLED_TRIAL_FLOW` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-64fa033f6b2d.js` → `Visualization`.

#### Randomized experiment

Experiment stage

Type `RANDOMIZED_EXPERIMENT` · manifest v2.

Parameters: `experimental_units` (integer, default `16`, range 6 to 30); `treatment_effect` (number, default `8`, range -20 to 20).

Source: manifest `type-b2315d4b532d.js`; view `visualization-c1ba73048882.js` → `RandomizedExperimentVisualization`.

#### Rates and bonds

Type `RATES_AND_BONDS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-57808137f3a5.js` → `RatesAndBondsVisualization`.

#### Rational inequality sign chart

Step 1: Find critical values

Type `RATIONAL_INEQUALITY_SIGN_CHART` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8062c6d9d192.js` → `RationalInequalitySignChartVisualization`.

#### Rational limits at infinity

Numerator leading coefficient {variable}

Type `RATIONAL_LIMITS_AT_INFINITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-adf87cd26bcd.js` → `RationalLimitsAtInfinityVisualization`.

#### Reaction order plots

Reaction order

Type `REACTION_ORDER_PLOTS` · manifest v3.

Parameters: `reaction_order` (enum, default `first-order`, one of `zero-order`, `first-order`, `second-order`).

Source: manifest `type-d93f8783cbfc.js`; view `visualization-37c85d548853.js` → `ReactionOrderPlotsVisualization`.

#### Reaction rate over time

Observed species

Type `REACTION_RATE_OVER_TIME` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-76c42db2dcaa.js` → `ReactionRateVisualization`.

#### Reaction thermodynamics: `\Delta H = H_{\mathrm{products}} - H_{\mathrm{reactants}}`

Forward activation energy

Type `REACTION_THERMODYNAMICS` · manifest v3 · formula `\Delta H = H_{\mathrm{products}} - H_{\mathrm{reactants}}`.

Parameters: `activationEnergyKilojoulesPerMole` (number, default `90`, range 50 to 150); `enthalpyChangeKilojoulesPerMole` (number, default `-30`, range -60 to 40).

Source: manifest `type-f44192a3e2d7.js`; view `visualization-6f6e6641055b.js` → `ReactionThermodynamicsVisualization`.

#### Reaction type explorer

Type `REACTION_TYPE_EXPLORER` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-609396e7fce0.js` → `ReactionTypeExplorerVisualization`.

#### Recrystallization purification

Low cold solubility

Type `RECRYSTALLIZATION_PURIFICATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-cfb820b2834b.js` → `RecrystallizationVisualization`.

#### Rectangle area

Type `RECTANGLE_AREA` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b9cc087bc809.js` → `RectangleAreaVisualization`.

#### Rectangular prism volume

Type `RECTANGULAR_PRISM_VOLUME` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-960cb61ffc47.js` → `RectangularPrismVolumeVisualization`.

#### Redox electron transfer

Reaction stage

Type `REDOX_ELECTRON_TRANSFER` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f6f7f290173a.js` → `Visualization`.

#### Reflection transformation coordinate plane

Point

Type `REFLECTION_TRANSFORMATION_COORDINATE_PLANE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-424b3d479de9.js` → `ReflectionTransformationCoordinatePlaneVisualization`.

#### Reorder point and safety stock

Type `REORDER_POINT_AND_SAFETY_STOCK` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5f975ed73590.js` → `ReorderPointAndSafetyStockVisualization`.

#### Resistors in parallel equivalent: `\frac{1}{R_T} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3}`

Type `RESISTORS_IN_PARALLEL_EQUIVALENT` · manifest v4 · formula `\frac{1}{R_T} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3}`, also `\frac{1}{R_T} = \frac{1}{R_1} + \frac{1}{R_2}`, `\frac{1}{R_{\text{eq}}} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3}`.

Parameters: `r1` (number, default `8`, range 0.1 to 100000); `r2` (number, default `8`, range 0.1 to 100000); `r3` (number, default `8`, range 0.1 to 100000); `voltage` (number, default `12`, range 0 to 1000).

Source: manifest `type-1994a14ca218.js`; view `visualization-3cc235973519.js` → `ResistorsInParallelEquivalentVisualization`.

#### Resistors in series equivalent: `R_{\text{total}} = R_1 + R_2 + \dots`

Type `RESISTORS_IN_SERIES_EQUIVALENT` · manifest v4 · formula `R_{\text{total}} = R_1 + R_2 + \dots`, also `R_{\text{eq}} = R_1 + R_2 + R_3`, `R_T = R_1 + R_2 + R_3`, `R_{eq} = R_1 + R_2 + R_3`.

Parameters: `r1` (number, default `8`, range 0.1 to 100000); `r2` (number, default `8`, range 0.1 to 100000); `r3` (number, default `8`, range 0.1 to 100000); `voltage` (number, default `12`, range 0 to 1000).

Source: manifest `type-ff1e86d5dbe7.js`; view `visualization-591029000e37.js` → `ResistorsInSeriesEquivalentVisualization`.

#### Resonance structures

Resonance example

Type `RESONANCE_STRUCTURES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f8a153e2f8e3.js` → `Visualization`.

#### Rest value chart

Choose a rest value to compare

Type `REST_VALUE_CHART` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b7aa190aef5a.js` → `Visualization`.

#### Restriction enzyme map

Restriction digest

Type `RESTRICTION_ENZYME_MAP` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b36e962182f5.js` → `Visualization`.

#### Rgb additive mixing

Red channel level

Type `RGB_ADDITIVE_MIXING` · manifest v3.

Parameters: `red` (integer, default `255`, range 0 to 255); `green` (integer, default `255`, range 0 to 255); `blue` (integer, default `255`, range 0 to 255).

Source: manifest `type-8b177dd67695.js`; view `visualization-66a8d4e1bd24.js` → `RgbAdditiveMixingVisualization`.

#### Riemann sums

Type `RIEMANN_SUMS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-fab1fd665275.js` → `IntegrationEstimationVisualization`.

#### Right triangle

Type `RIGHT_TRIANGLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ebeb1c61d3d4.js` → `RightTriangleVisualization`.

#### Rna processing

Type `RNA_PROCESSING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-962f18507504.js` → `Visualization`.

#### Roc curve

Area under the ROC curve

Type `ROC_CURVE` · manifest v3.

Parameters: `auroc` (number, default `0.75`, range 0.5 to 0.95); `threshold` (number, default `0.5`, range 0 to 1).

Source: manifest `type-c65766b09e91.js`; view `visualization-26586fe27987.js` → `RocCurveVisualization`.

#### Rock cycle

Starting material

Type `ROCK_CYCLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-12f7c15a6615.js` → `RockCycleVisualization`.

#### Rods cones light levels

Type `RODS_CONES_LIGHT_LEVELS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d0b826dbabbd.js` → `RodsConesLightLevelsVisualization`.

#### Rolles theorem

Type `ROLLES_THEOREM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5a4cc563cacf.js` → `RollesTheoremVisualization`.

#### Root power equivalence

Type `ROOT_POWER_EQUIVALENCE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-fc85f0fae92f.js` → `RootPowerEquivalenceVisualization`.

#### Rotation transformation coordinate plane

Type `ROTATION_TRANSFORMATION_COORDINATE_PLANE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-aa46077b8f3b.js` → `RotationTransformationCoordinatePlaneVisualization`.

#### Round robin cpu scheduling

Time quantum

Type `ROUND_ROBIN_CPU_SCHEDULING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-cf3dd795dbf4.js` → `RoundRobinCpuSchedulingVisualization`.

#### Rutherford gold foil experiment

Choose the atomic model

Type `RUTHERFORD_GOLD_FOIL_EXPERIMENT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-cb5d14c56709.js` → `Visualization`.

#### Saltwater intrusion

Type `SALTWATER_INTRUSION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e2919236ff7d.js` → `Visualization`.

#### Sample space grid

Type `SAMPLE_SPACE_GRID` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-a67a31a345d2.js` → `SampleSpaceGridVisualization`.

#### Sample variance

Type `SAMPLE_VARIANCE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-0343d34601ec.js` → `SampleVarianceVisualization`.

#### Sampling distribution

Population shape

Type `SAMPLING_DISTRIBUTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b71883b6e8be.js` → `SamplingDistributionVisualization`.

#### Sampling without replacement

First-draw branch to inspect

Type `SAMPLING_WITHOUT_REPLACEMENT` · manifest v3.

Parameters: `category_a_count` (integer, default `4`, range 1 to 10); `category_b_count` (integer, default `3`, range 1 to 10).

Source: manifest `type-9a0c50e93ce3.js`; view `visualization-727f8f66b859.js` → `SamplingWithoutReplacementVisualization`.

#### Sarcomere structure

Type `SARCOMERE_STRUCTURE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-acf40c7e0ef5.js` → `SarcomereStructureVisualization`.

#### Saturated vs unsaturated solution

Solid solute added

Type `SATURATED_VS_UNSATURATED_SOLUTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-2a741051a105.js` → `Visualization`.

#### Scalene triangle

Type `SCALENE_TRIANGLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f5544fcb9566.js` → `ScaleneTriangleVisualization`.

#### Scientific notation

Type `SCIENTIFIC_NOTATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-55f74eb1f7f5.js` → `ScientificNotationVisualization`.

#### Sea level rise

Observation interval

Type `SEA_LEVEL_RISE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ed8f21e7d924.js` → `Visualization`.

#### Seasons and solar angle

Type `SEASONS_AND_SOLAR_ANGLE` · manifest v3.

Parameters: `latitude_degrees` (number, default `40`, range -80 to 80).

Source: manifest `type-afd9de5814d9.js`; view `visualization-b50d087774c3.js` → `SeasonsVisualization`.

#### Seed germination

Type `SEED_GERMINATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d9fe4e5ee1c6.js` → `SeedGerminationVisualization`.

#### Segment ratio: `AP:PB=m:n`

Type `SEGMENT_RATIO` · manifest v1 · formula `AP:PB=m:n`.

Parameters: `pointAX` (number, default `-6`, range -10000 to 10000); `pointAY` (number, default `-2`, range -10000 to 10000); `segmentLength` (number, default `14.142135623730951`, range 1 to 10000); `segmentAngleDeg` (number, default `45`, range -180 to 180); `m` (integer, default `2`, range 1 to 12); `n` (integer, default `3`, range 1 to 12).

Source: manifest `type-10f0ea8edfaf.js`; view `visualization-9dfd7d22bbea.js` → `SegmentRatioVisualization`.

#### Selection patterns

{pattern} selection panel at {stage}.

Type `SELECTION_PATTERNS` · manifest v3.

Parameters: `initial_selection_pattern` (enum, default `stabilizing`, one of `stabilizing`, `directional`, `disruptive`).

Source: manifest `type-111ad055626d.js`; view `visualization-50a1bda8191c.js` → `SelectionPatternsVisualization`.

#### Selection sort

Type `SELECTION_SORT` · manifest v2.

Parameters: `order` (enum, default `6,3,8,2,7,1,5,4`, one of `6,3,8,2,7,1,5,4`, `8,7,6,5,4,3,2,1`, `1,2,3,4,5,6,7,8`, `4,1,7,3,8,5,2,6`).

Source: manifest `type-979c1644f178.js`; view `visualization-56a33c304034.js` → `SelectionSortVisualization`.

#### Set operations venn regions

Type `SET_OPERATIONS_VENN_REGIONS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c6af391014f2.js` → `SetOperationsVennRegionsVisualization`.

#### Shadow price

Resource limit {variable}

Type `SHADOW_PRICE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ee0df7123bfb.js` → `ShadowPriceVisualization`.

#### Shutdown decision

Type `SHUTDOWN_DECISION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f7db3a89c28b.js` → `ShutdownDecisionVisualization`.

#### Side by side box plots

Comparison-group median

Type `SIDE_BY_SIDE_BOX_PLOTS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b8e0324b32f6.js` → `SideBySideBoxPlotsVisualization`.

#### Similar triangles

Type `SIMILAR_TRIANGLES` · manifest v3.

Parameters: `scale` (number, default `1.4`, range 0.5 to 2).

Source: manifest `type-57ca60bb3e4c.js`; view `visualization-1588d8e0646a.js` → `SimilarTrianglesVisualization`.

#### Simple division

Type `SIMPLE_DIVISION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-83f0e4048e66.js` → `SimpleDivisionVisualization`.

#### Simple pendulum: `T \approx 2\pi\sqrt{\frac{L}{g}}`

Type `SIMPLE_PENDULUM` · manifest v1 · formula `T \approx 2\pi\sqrt{\frac{L}{g}}`.

Parameters: `lengthMeters` (number, default `1.2`, range 0.5 to 2); `startingAngleDegrees` (number, default `35`, range 5 to 60).

Source: manifest `type-fff8bf6df8e9.js`; view `visualization-90f163f6bba3.js` → `SimplePendulumVisualization`.

#### Simplified fraction

Type `SIMPLIFIED_FRACTION` · manifest v2.

Parameters: `numerator` (integer, default `6`, range 1 to 12); `denominator` (integer, default `8`, range 4 to 24).

Source: manifest `type-b2d049022561.js`; view `visualization-c7c84808699b.js` → `SimplifiedFractionVisualization`.

#### Simpson rule

Type `SIMPSON_RULE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-88fe6f4b97e3.js` → `SimpsonRuleVisualization`.

#### Singly linked list pointers

Type `SINGLY_LINKED_LIST_POINTERS` · manifest v2.

Parameters: `operation` (enum, default `insert`, one of `insert`, `delete`).

Source: manifest `type-bc36333e58e1.js`; view `visualization-a170a88da1b4.js` → `SinglyLinkedListPointersVisualization`.

#### Singular value decomposition: `A=U\Sigma V^{\mathsf T}`

Type `SINGULAR_VALUE_DECOMPOSITION` · manifest v1 · formula `A=U\Sigma V^{\mathsf T}`.

Parameters: `rank` (integer, default `2`, range 1 to 4).

Source: manifest `type-3a822ada5784.js`; view `visualization-5f43c808cee0.js` → `SingularValueDecompositionVisualization`.

#### Skeleton and muscle movement

Type `SKELETON_AND_MUSCLE_MOVEMENT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1d7579856410.js` → `SkeletonAndMuscleMovementVisualization`.

#### Skewness direction

Type `SKEWNESS_DIRECTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-31af11c9afdd.js` → `SkewnessDirectionVisualization`.

#### Sleep cycle hypnogram

Type `SLEEP_CYCLE_HYPNOGRAM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-fd58dd9ee294.js` → `Visualization`.

#### Sliding filament muscle contraction

Calcium absent

Type `SLIDING_FILAMENT_MUSCLE_CONTRACTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5b449e3844d3.js` → `SlidingFilamentVisualization`.

#### Slope equation

Type `SLOPE_EQUATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f11a7ef4aa41.js` → `SlopeEquationVisualization`.

#### Slope intercept: `y = mx + b`

Type `SLOPE_INTERCEPT` · manifest v2 · formula `y = mx + b`, also `f(x)=mx+b`, `y = mx + c`.

Parameters: `slope` (number, default `1`, range -10000 to 10000); `intercept` (number, default `5`, range -10000 to 10000).

Source: manifest `type-110ca488953a.js`; view `visualization-fb1ef6309bd6.js` → `SlopeInterceptVisualization`.

#### Sn1 vs sn2 substitution

Substitution mechanism

Type `SN1_VS_SN2_SUBSTITUTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b8f37dd3a82d.js` → `Visualization`.

#### Soil field capacity and wilting point

Soil-water state

Type `SOIL_FIELD_CAPACITY_AND_WILTING_POINT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4b4e47357208.js` → `SoilWaterVisualization`.

#### Soil texture and water retention

Emphasized soil texture

Type `SOIL_TEXTURE_AND_WATER_RETENTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-701a43589661.js` → `SoilTextureAndWaterRetentionVisualization`.

#### Soil texture triangle

Sand percentage

Type `SOIL_TEXTURE_TRIANGLE` · manifest v1.

Parameters: `sand_percent` (number, default `40`, range 0 to 100); `clay_percent` (number, default `20`, range 0 to 100).

Source: manifest `type-4ea25b9db993.js`; view `visualization-2864b4e051f7.js` → `Visualization`.

#### Solar photovoltaic system

Available sunlight

Type `SOLAR_PHOTOVOLTAIC_SYSTEM` · manifest v2.

Parameters: `array_capacity_kw` (number, default `6`, range 1 to 20).

Source: manifest `type-f31fc951c570.js`; view `visualization-a034074bbf62.js` → `SolarPhotovoltaicSystemVisualization`.

#### Solenoid internal field: `B = \mu_0 n I`

Clockwise, viewed from the left end

Type `SOLENOID_INTERNAL_FIELD` · manifest v1 · formula `B = \mu_0 n I`.

Parameters: `currentAmperes` (number, default `2`, range 0.5 to 5); `turnsPerMeter` (number, default `500`, range 100 to 1000); `direction` (enum, default `counterclockwise`, one of `clockwise`, `counterclockwise`).

Source: manifest `type-17796e12b6d2.js`; view `visualization-ac4eecfced6c.js` → `SolenoidInternalFieldVisualization`.

#### Solow steady state: `s f(k^*) = (\delta + n + g)k^*`

Type `SOLOW_STEADY_STATE` · manifest v4 · formula `s f(k^*) = (\delta + n + g)k^*`.

Parameters: `savingRatePercent` (number, default `40`, range 20 to 50); `depreciationRatePercent` (number, default `5`, range 4.5 to 10); `populationGrowthRatePercent` (number, default `1.5`, range 1 to 4); `technologyGrowthRatePercent` (number, default `2`, range 1.5 to 4).

Source: manifest `type-3ecced4722ba.js`; view `visualization-35828fd6843e.js` → `SolowSteadyStateVisualization`.

#### Solubility equilibrium

Initial ion product relative to Ksp

Type `SOLUBILITY_EQUILIBRIUM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-50dbf2b667e2.js` → `SolubilityEquilibriumVisualization`.

#### Solution dilution: `M_1V_1=M_2V_2`

Type `SOLUTION_DILUTION` · manifest v1 · formula `M_1V_1=M_2V_2`.

Parameters: `initialConcentrationMolesPerLiter` (number, default `1.5`, range 0.1 to 3); `initialVolumeLiters` (number, default `2`, range 0.5 to 5); `waterAddedLiters` (number, default `3`, range 0 to 5).

Source: manifest `type-b20da9986277.js`; view `visualization-cf855229b019.js` → `SolutionDilutionVisualization`.

#### Speciation

Speciation stage

Type `SPECIATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-59e8ce74f08f.js` → `SpeciationVisualization`.

#### Specific heat: `\Delta T = \frac{q}{mc}`

{material} sample

Type `SPECIFIC_HEAT` · manifest v1 · formula `\Delta T = \frac{q}{mc}`.

Parameters: `material` (enum, default `water`, one of `copper`, `sand`, `water`); `heatKj` (number, default `40`, range 0 to 60).

Source: manifest `type-34ba530d4dd9.js`; view `visualization-e7575e55d558.js` → `SpecificHeatVisualization`.

#### Sphere volume: `V = \frac{4}{3}\pi r^3`

Type `SPHERE_VOLUME` · manifest v4 · formula `V = \frac{4}{3}\pi r^3`, also `4/3pir^3=v`, `4/3pir^3`.

Parameters: `radius` (number, default `3`, range 0.01 to 10000).

Source: manifest `type-6b1390f6b07f.js`; view `visualization-142b52c9ea2b.js` → `SphereVolumeVisualization`.

#### Spreadsheet if function

Type `SPREADSHEET_IF_FUNCTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b3cbab7d3e01.js` → `SpreadsheetIfVisualization`.

#### Spreadsheet text extraction

Choose LEFT, RIGHT, or MID

Type `SPREADSHEET_TEXT_EXTRACTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-dc646bbae4bb.js` → `Visualization`.

#### Sql ddl vs dml

Type `SQL_DDL_VS_DML` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d410b4b058c0.js` → `Visualization`.

#### Sql group by

Type `SQL_GROUP_BY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1c4040df0329.js` → `SqlGroupByVisualization`.

#### Sql join

Type `SQL_JOIN` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5c0155dfd443.js` → `SqlJoinVisualization`.

#### Sql primary foreign key constraints

Insert a child with an existing parent

Type `SQL_PRIMARY_FOREIGN_KEY_CONSTRAINTS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5a4b6de6a14f.js` → `Visualization`.

#### Sql transaction commit rollback

Type `SQL_TRANSACTION_COMMIT_ROLLBACK` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-87ef2bf8072f.js` → `SqlTransactionVisualization`.

#### Square area

Type `SQUARE_AREA` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ea9b4edc5bbb.js` → `SquareAreaVisualization`.

#### Sras

Signed short-run aggregate supply shift

Type `SRAS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-7242f8a70295.js` → `SrasVisualization`.

#### Standard deviation

Population standard deviation

Type `STANDARD_DEVIATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-d4ada51c7cb2.js` → `StandardDeviationVisualization`.

#### Standard score z: `z = \frac{x - \mu}{\sigma}`

Type `STANDARD_SCORE_Z` · manifest v6 · formula `z = \frac{x - \mu}{\sigma}`, also `z = \frac{x - \bar{x}}{s}`, `z = \frac{\bar{x} - \mu_0}{\sigma / \sqrt{n}}`, `z = \frac{\bar{x} - \mu0}{\sigma / \sqrt{n}}`.

Parameters: `x` (number, default `1.2`, range -4 to 4); `mu` (number, default `0`, range -1.5 to 1.5); `sigma` (number, default `1`, range 0.4 to 1.8).

Source: manifest `type-3941c7525dca.js`; view `visualization-1bcd3561dba4.js` → `StandardScoreZVisualization`.

#### States of matter particle model

State of matter

Type `STATES_OF_MATTER_PARTICLE_MODEL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-580d1efb59ff.js` → `Visualization`.

#### Stereo field

Adjust stereo pan

Type `STEREO_FIELD` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-55b75f8cb47b.js` → `StereoFieldVisualization`.

#### Stoichiometric mole ratios

Amount of {name} in moles

Type `STOICHIOMETRIC_MOLE_RATIOS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f29df7fea597.js` → `StoichiometricMoleRatiosVisualization`.

#### Stopping distance safe following: `d_{\mathrm{stop}}=d_{\mathrm{reaction}}+d_{\mathrm{braking}}`

Initial speed

Type `STOPPING_DISTANCE_SAFE_FOLLOWING` · manifest v5 · formula `d_{\mathrm{stop}}=d_{\mathrm{reaction}}+d_{\mathrm{braking}}`.

Parameters: `speedKmh` (number, default `60`, range 30 to 100); `reactionTimeSeconds` (number, default `1`, range 0.5 to 2); `roadCondition` (enum, default `dry`, one of `dry`, `wet`, `snow_ice`).

Source: manifest `type-23e40668163a.js`; view `visualization-b3af0e7812a8.js` → `StoppingDistanceVisualization`.

#### Storm hydrograph

Rainfall-intensity plot. Peak rainfall occurs at {hour, plural, one {# hour} other {# hours}}; the rainfall event is separate from river discharge and bankfull capacity.

Type `STORM_HYDROGRAPH` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4d7c9797ca6f.js` → `Visualization`.

#### Straight line depreciation

Type `STRAIGHT_LINE_DEPRECIATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-891018cba9f8.js` → `StraightLineDepreciationVisualization`.

#### Stratospheric ozone depletion

Typical stratosphere

Type `STRATOSPHERIC_OZONE_DEPLETION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-18df26a2c4c5.js` → `Visualization`.

#### Stress strain material limits

Type `STRESS_STRAIN_MATERIAL_LIMITS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f48e062180e1.js` → `StressStrainVisualization`.

#### Strong vs weak acid

Shared acid concentration

Type `STRONG_VS_WEAK_ACID` · manifest v2.

Parameters: `initial_concentration_molar` (number, default `0.15`, range 0.1 to 0.25).

Source: manifest `type-e8c4aa2e5b51.js`; view `visualization-ba00db39b762.js` → `Visualization`.

#### Structural isomers

Example family

Type `STRUCTURAL_ISOMERS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8b48f6cdac2c.js` → `Visualization`.

#### Subtracting integers

Type `SUBTRACTING_INTEGERS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-beed21851e82.js` → `SubtractingIntegersVisualization`.

#### Subtracting negative integers

Type `SUBTRACTING_NEGATIVE_INTEGERS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c8b795a80842.js` → `SubtractingNegativeIntegersVisualization`.

#### Successive percent change: `100\left(1+\frac{p_1}{100}\right)\left(1+\frac{p_2}{100}\right)`

First percent change

Type `SUCCESSIVE_PERCENT_CHANGE` · manifest v3 · formula `100\left(1+\frac{p_1}{100}\right)\left(1+\frac{p_2}{100}\right)`.

Parameters: `firstChangePercent` (number, default `50`, range -95 to 100); `secondChangePercent` (number, default `-50`, range -100 to 100).

Source: manifest `type-d21946d43d46.js`; view `visualization-13cbbb35e267.js` → `SuccessivePercentChangeVisualization`.

#### Supply and demand

Type `SUPPLY_AND_DEMAND` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-df04a8bbf315.js` → `MarketEquilibriumShiftsVisualization`.

#### Supply curve

Type `SUPPLY_CURVE` · manifest v1.

Parameters: `price` (number, default `5`, range 2 to 8); `supplyShift` (number, default `0`, range -1 to 1).

Source: manifest `type-592d41260a2e.js`; view `visualization-49db0b531524.js` → `SupplyCurveVisualization`.

#### Supply shock

Signed supply shock

Type `SUPPLY_SHOCK` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-aab9da065218.js` → `SupplyShockVisualization`.

#### Surface area cube

Type `SURFACE_AREA_CUBE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-54a1fedfce2c.js` → `SurfaceAreaCubeVisualization`.

#### Surface area sphere

Type `SURFACE_AREA_SPHERE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-db350bbdc5e5.js` → `SurfaceAreaSphereVisualization`.

#### Surface area to volume ratio

Type `SURFACE_AREA_TO_VOLUME_RATIO` · manifest v1.

Parameters: `side_length` (integer, default `3`, range 1 to 6).

Source: manifest `type-96f57cd357c8.js`; view `visualization-f4983a4d5f73.js` → `SurfaceAreaToVolumeRatioVisualization`.

#### Survivorship curves

Relative age as a percentage of maximum lifespan

Type `SURVIVORSHIP_CURVES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c58d645b851e.js` → `Visualization`.

#### Synaptic transmission

Type `SYNAPTIC_TRANSMISSION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-455561cc845a.js` → `SynapticTransmissionVisualization`.

#### Synth signal flow

LFO destination

Type `SYNTH_SIGNAL_FLOW` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-60f261401eb4.js` → `Visualization`.

#### Synthetic division

Type `SYNTHETIC_DIVISION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-88bdade97016.js` → `SyntheticDivisionVisualization`.

#### System of equations

Type `SYSTEM_OF_EQUATIONS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-12c3833b7fa1.js` → `SystemOfEquationsVisualization`.

#### T distribution

Degrees of freedom

Type `T_DISTRIBUTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ba68d93d837f.js` → `Visualization`.

#### T stat p score

Observed t-statistic

Type `T_STAT_P_SCORE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-94e1e68ce9a3.js` → `TStatPScoreVisualization`.

#### Tangent segments common point: `PA = PB`

Type `TANGENT_SEGMENTS_COMMON_POINT` · manifest v1 · formula `PA = PB`.

Parameters: `radius` (number, default `3.5`, range 2.5 to 4.5); `pointDistance` (number, default `7.2`, range 5.8 to 7.2); `pointAngleDeg` (number, default `180`, range 145 to 215).

Source: manifest `type-32562c107c2d.js`; view `visualization-01f0830feedc.js` → `TangentSegmentsCommonPointVisualization`.

#### Tariff

Type `TARIFF` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e69718094d3c.js` → `Visualization`.

#### Tax incidence and elasticity

Type `TAX_INCIDENCE_AND_ELASTICITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-16cde0f54c24.js` → `ExciseTaxVisualization`.

#### Taxes and subsidies

Subsidy per unit

Type `TAXES_AND_SUBSIDIES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4b98d67bbebe.js` → `Visualization`.

#### Taylor series expansion

Type `TAYLOR_SERIES_EXPANSION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-435c5086167f.js` → `TaylorSeriesExpansionVisualization`.

#### Tcp three way handshake

TCP handshake stage

Type `TCP_THREE_WAY_HANDSHAKE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4c95818c2ec2.js` → `TcpThreeWayHandshakeVisualization`.

#### Tcp vs udp

Type `TCP_VS_UDP` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-9c70449f03c0.js` → `TcpVsUdpVisualization`.

#### Tempo marking chart

Select a tempo marking

Type `TEMPO_MARKING_CHART` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-3e25e3d6ff0c.js` → `Visualization`.

#### Tendon reflex

Type `TENDON_REFLEX` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-67d5e7429a2f.js` → `TendonReflexVisualization`.

#### Test cross

AA, homozygous dominant

Type `TEST_CROSS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b39b1786799b.js` → `Visualization`.

#### Thermohaline circulation

Type `THERMOHALINE_CIRCULATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e32cda290664.js` → `Visualization`.

#### Three set inclusion exclusion

Inclusion-exclusion step

Type `THREE_SET_INCLUSION_EXCLUSION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-cdff458bb8e1.js` → `ThreeSetInclusionExclusionVisualization`.

#### Thyroid regulation

Type `THYROID_REGULATION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-48a1119ac114.js` → `ThyroidRegulationVisualization`.

#### Torque

Type `TORQUE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-68d2dcd3a5ca.js` → `TorqueVisualization`.

#### Transversal angle relationships

Type `TRANSVERSAL_ANGLE_RELATIONSHIPS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-37847fe1567e.js` → `TransversalAngleRelationshipsVisualization`.

#### Trapezoid area

Type `TRAPEZOID_AREA` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c611f43ae106.js` → `TrapezoidAreaVisualization`.

#### Trapezoidal rule

Type `TRAPEZOIDAL_RULE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1ffae35cd6f6.js` → `IntegrationEstimationVisualization`.

#### Triangle angle sum

Type `TRIANGLE_ANGLE_SUM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b6ee7c51a63f.js` → `TriangleAngleSumVisualization`.

#### Triangle angle sum proof

Type `TRIANGLE_ANGLE_SUM_PROOF` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ea29eee49ae4.js` → `TriangleAngleSumProofVisualization`.

#### Triangle area: `A = \frac{1}{2}bh`

Type `TRIANGLE_AREA` · manifest v3 · formula `A = \frac{1}{2}bh`, also `A = \frac{1}{2} b h`, `a=bh/2`, `1/2bh=a`, `bh/2=a`, `1/2bh`, `b = \frac{2A}{h}`, `h = \frac{2A}{b}`.

Parameters: `base` (number, default `8`, range 0.01 to 10000); `height` (number, default `6`, range 0.01 to 10000).

Source: manifest `type-cb23494cad1e.js`; view `visualization-bf6d6326f0c4.js` → `TriangleAreaVisualization`.

#### Trig angle sum identity

Type `TRIG_ANGLE_SUM_IDENTITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8fe47c212579.js` → `TrigAngleSumIdentityVisualization`.

#### Trig component x

Type `TRIG_COMPONENT_X` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b8f135415f77.js` → `TrigComponentXVisualization`.

#### Trig component y

Type `TRIG_COMPONENT_Y` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-160875840d03.js` → `TrigComponentYVisualization`.

#### Trig identity pythagorean

Type `TRIG_IDENTITY_PYTHAGOREAN` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-1488f4207bdb.js` → `TrigIdentityVisualization`.

#### Trig inverse

Graph of the inverse trigonometric function. The highlighted point has input {inputValue} and theta {angleRadiansCount, plural, one {{angleRadians} radian} other {{angleRadians} radians}}, about {angleDegreesCount, plural, one {{angleDegrees} degree} other {{angleDegrees} degrees}}.

Type `TRIG_INVERSE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-58e87872b140.js` → `TrigInverseVisualization`.

#### Trig ratio tangent: `\tan(\theta) = \frac{\sin(\theta)}{\cos(\theta)}`

Type `TRIG_RATIO_TANGENT` · manifest v4 · formula `\tan(\theta) = \frac{\sin(\theta)}{\cos(\theta)}`, also `\tan x = \frac{\sin x}{\cos x}`, `\tan(\theta)=\frac{opposite}{adjacent}`.

Parameters: `angleDeg` (number, default `35`, range 0.01 to 89.99); `angleLabel` (enum, default `θ`, one of `θ`, `α`, `β`, `φ`, `γ`).

Source: manifest `type-ffe33386dff8.js`; view `visualization-e7b2815fe6cf.js` → `TrigRatioTangentVisualization`.

#### Two cable static equilibrium

Type `TWO_CABLE_STATIC_EQUILIBRIUM` · manifest v2.

Parameters: `leftAngleDegrees` (number, default `45`, range 10 to 80); `rightAngleDegrees` (number, default `45`, range 10 to 80); `weightNewtons` (number, default `200`, range 50 to 500).

Source: manifest `type-3854ea3b6661.js`; view `visualization-e2265127ebad.js` → `TwoCableEquilibriumVisualization`.

#### Two digit multiply

First two-digit factor

Type `TWO_DIGIT_MULTIPLY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-94c739a0e9a7.js` → `TwoDigitMultiplyVisualization`.

#### Two dimensional array indexing

Row index

Type `TWO_DIMENSIONAL_ARRAY_INDEXING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c65d96e23ff5.js` → `Visualization`.

#### Two sample t test

Observed difference between group means

Type `TWO_SAMPLE_T_TEST` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5384166c9598.js` → `TwoSampleTTestVisualization`.

#### Twos complement

Type `TWOS_COMPLEMENT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-201ab5e68a05.js` → `TwosComplementVisualization`.

#### Type i type ii power

Significance level

Type `TYPE_I_TYPE_II_POWER` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-f5aea01a4833.js` → `TypeITypeIIPowerVisualization`.

#### Union probability inclusion exclusion

Type `UNION_PROBABILITY_INCLUSION_EXCLUSION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-35d935555ef3.js` → `UnionProbabilityInclusionExclusionVisualization`.

#### Unit circle: `x^2 + y^2 = 1`

Type `UNIT_CIRCLE` · manifest v3 · formula `x^2 + y^2 = 1`, also `1 = x^2 + y^2`, `x^2 + y^2 = 1^2`, `(x-0)^2 + (y+0)^2 = 1`, `(\cos\theta, \sin\theta)`.

Parameters: `angleDeg` (number, default `45`, range -36000 to 36000).

Source: manifest `type-4677b661e846.js`; view `visualization-1d3bd3bed867.js` → `UnitCircleVisualization`.

#### Urbanization and impervious surfaces

Land cover

Type `URBANIZATION_AND_IMPERVIOUS_SURFACES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-817ac4990409.js` → `UrbanizationVisualization`.

#### Vapor pressure

Type `VAPOR_PRESSURE` · manifest v5.

Parameters: `initial_temperature_c` (number, default `25`, range 0 to 60); `surrounding_pressure_kpa` (number, default `101.325`, range 40 to 160).

Source: manifest `type-15f2f7d7853c.js`; view `visualization-9ffa51dd8c8d.js` → `VaporPressureVisualization`.

#### Vapor pressure lowering

Nonvolatile-solute mole fraction

Type `VAPOR_PRESSURE_LOWERING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ce50e4ee5ab2.js` → `VaporPressureLoweringVisualization`.

#### Variance

Type `VARIANCE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-73be326f2a2c.js` → `VarianceVisualization`.

#### Vector components: `x=r\cos\theta,\qquad y=r\sin\theta`

Type `VECTOR_COMPONENTS` · manifest v2 · formula `x=r\cos\theta,\qquad y=r\sin\theta`, also `\vec v=\langle r\cos\theta,\ r\sin\theta\rangle`, `(x,y)=(r\cos\theta,r\sin\theta)`.

Parameters: `magnitude` (number, default `6`, range 0.1 to 100); `angleDeg` (number, default `35`, range -180 to 180).

Source: manifest `type-f1e9ea4637a1.js`; view `visualization-6fa0a496dff1.js` → `VectorComponentsVisualization`.

#### Vector dot product

Vector {vector}, {component} component

Type `VECTOR_DOT_PRODUCT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-9658b8ec9ec2.js` → `VectorDotProductVisualization`.

#### Vector projection

Type `VECTOR_PROJECTION` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-306028075547.js` → `VectorProjectionVisualization`.

#### Velocity as slope graph

Position point at {timeCount, plural, one {{time} second} other {{time} seconds}} and {positionCount, plural, one {{position} meter} other {{position} meters}}. Drag vertically or use the Up and Down arrow keys to change its position.

Type `VELOCITY_AS_SLOPE_GRAPH` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-5d022265a4bb.js` → `VelocityAsSlopeGraphVisualization`.

#### Venn diagram two set counting

Type `VENN_DIAGRAM_TWO_SET_COUNTING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-68fb0a5e3cfa.js` → `VennDiagramTwoSetCountingVisualization`.

#### Virus life cycle

Type `VIRUS_LIFE_CYCLE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c0dc64de3c4b.js` → `VirusLifeCycleVisualization`.

#### Visual fields

Type `VISUAL_FIELDS` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-741a3eab6de1.js` → `VisualFieldsVisualization`.

#### Vocal ranges

Vocal classification

Type `VOCAL_RANGES` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-e456bf447773.js` → `Visualization`.

#### Volume cube

Type `VOLUME_CUBE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b93e5f11d166.js` → `VolumeCubeVisualization`.

#### Waste hierarchy

Type `WASTE_HIERARCHY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ffcaf6e7ac8e.js` → `Visualization`.

#### Wastewater treatment

Wastewater treatment stage

Type `WASTEWATER_TREATMENT` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ebeb8457b83e.js` → `WastewaterTreatmentVisualization`.

#### Water phase diagram

Temperature in degrees Celsius

Type `WATER_PHASE_DIAGRAM` · manifest v2.

Parameters: `temperature_c` (number, default `25`, range -80 to 450); `pressure_kpa` (number, default `101.325`, range 0.001 to 50000).

Source: manifest `type-9acfe2203543.js`; view `visualization-4db97a6705cb.js` → `WaterPhaseDiagramVisualization`.

#### Water polarity

Move neighboring water horizontally

Type `WATER_POLARITY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-b5aaf9cb457b.js` → `Visualization`.

#### Water potential

Magnitude of the negative solute potential on the right

Type `WATER_POTENTIAL` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-51350225caa1.js` → `WaterPotentialVisualization`.

#### Wave speed: `v = f\lambda`

Type `WAVE_SPEED` · manifest v3 · formula `v = f\lambda`, also `\nu = \frac{c}{\lambda}`, `v = f lambda`, `v=flambda`, `v=lambdaf`, `flambda=v`, `lambdaf=v`, `f=v/lambda`, `lambda=v/f`.

Parameters: `frequency` (number, default `2`, range 0.1 to 20000); `wavelength` (number, default `3`, range 0.1 to 10000).

Source: manifest `type-ac19101079c5.js`; view `visualization-51ad4b5172e6.js` → `WaveSpeedVisualization`.

#### Waveform anatomy

Choose the horizontal axis

Type `WAVEFORM_ANATOMY` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-df4ceac4812c.js` → `WaveformAnatomyVisualization`.

#### Weight force: `F_g = mg`

Type `WEIGHT_FORCE` · manifest v3 · formula `F_g = mg`, also `F_G = m g`, `w = mg`, `F_g = m\,g`, `P = m \cdot g`, `F_g = m \cdot g`, `F_g = m \times g`, `m = \frac{F_g}{g}`, `g = \frac{F_g}{m}`.

Parameters: `mass` (number, default `8`, range 0.01 to 10000); `gravity` (number, default `9.8`, range 0 to 10000).

Source: manifest `type-722d579b6777.js`; view `visualization-58ce41c0cf27.js` → `WeightForceVisualization`.

#### Wetland filtration and flood buffering

Wetland condition

Type `WETLAND_FILTRATION_AND_FLOOD_BUFFERING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-4c3bb4cf91f3.js` → `Visualization`.

#### While loop boolean condition

Starting counter

Type `WHILE_LOOP_BOOLEAN_CONDITION` · manifest v2.

Parameters: `initial_counter` (integer, default `2`, range 0 to 8); `stopping_bound` (integer, default `5`, range 0 to 8).

Source: manifest `type-161aea9178de.js`; view `visualization-595829a5da15.js` → `WhileLoopVisualization`.

#### Wilcoxon rank sum

Sample pattern

Type `WILCOXON_RANK_SUM` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-ceefcde82be1.js` → `WilcoxonRankSumVisualization`.

#### Wind turbine

Wind-turbine power curve. At {windSpeedCount, plural, one {{windSpeed} metre per second} other {{windSpeed} metres per second}} the turbine is in {region} and produces {power}. Cut-in is 3, rated speed is 12, and cut-out is 25 metres per second. The vertical scale is percentage of rated power.

Type `WIND_TURBINE` · manifest v3.

Parameters: `rated_power_kw` (number, default `3000`, range 100 to 20000).

Source: manifest `type-3f4953af8baf.js`; view `visualization-3935fee61dec.js` → `Visualization`.

#### Withdrawal reflex

Withdrawal reflex stage

Type `WITHDRAWAL_REFLEX` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-c3ff75499a1f.js` → `WithdrawalReflexVisualization`.

#### Work done by force

Type `WORK_DONE_BY_FORCE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-8db8211a2091.js` → `WorkDoneByForceVisualization`.

#### Z score p value

Observed z-score

Type `Z_SCORE_P_VALUE` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-aaa311fa003b.js` → `ZScorePValueVisualization`.

#### Zero based array indexing

Type `ZERO_BASED_ARRAY_INDEXING` · manifest v?.

Source: manifest `analytics-bc3295dda721.js (inline)`; view `visualization-30b371fa43ba.js` → `ZeroBasedArrayIndexingVisualization`.

### Manifest only (no renderer registered in this build) (31)

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

#### Kinematics velocity: `v_f = v_i + at`

Type `KINEMATICS_VELOCITY` · manifest v3 (also v) · formula `v_f = v_i + at`, also `v = u + at`, `v = v_0 + at`, `u + at = v`.

Parameters: `initialVelocityMetersPerSecond` (number, default `2`, range -6 to 10); `accelerationMetersPerSecondSquared` (number, default `1`, range -2 to 4); `timeSeconds` (number, default `5`, range 1 to 9).

Source: manifest `type-ce7a4fb22b44.js`.

#### Matrix transformation 2d: `A\vec{v}=\begin{bmatrix}a&b\\c&d\end{bmatrix}\begin{bmatrix}x\\y\end{bmatrix}`

Type `MATRIX_TRANSFORMATION_2D` · manifest v1 (also v) · formula `A\vec{v}=\begin{bmatrix}a&b\\c&d\end{bmatrix}\begin{bmatrix}x\\y\end{bmatrix}`.

Parameters: `matrixA` (number, default `2`, range -2 to 2); `matrixB` (number, default `0`, range -2 to 2); `matrixC` (number, default `0`, range -2 to 2); `matrixD` (number, default `2`, range -2 to 2); `vectorX` (number, default `1`, range -1.5 to 1.5); `vectorY` (number, default `1`, range -1.5 to 1.5).

Source: manifest `type-e537504d901a.js`.

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
