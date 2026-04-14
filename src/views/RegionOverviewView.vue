<template>
    <div>
        <p v-if="!regions && !subregions && !countries">Loading...</p>
        <div style="padding: 20px" v-else>
            <Row>

                <Column style="height:90vh; overflow:auto;display:block;" class="imageRow overflow-scroll">
                    <!-- <div> </div> -->
                    <POICard :id="region.poi.id" :label="region.poi.titleTranslation.german"
                        :type="poiTypeToString(region.poi.poiType)" :countryId="region.poi.countryId"
                        :wikiDataId="region.poi.wikiDataId" :imageUrl="getPreviewImage(region.poi)"
                        v-for="region in regions" :key="region.poi.poiId" />
                </Column>

                <Column style="height:90vh; overflow:auto;display:block;" class="imageRow overflow-scroll">
                    <!-- <div> </div> -->
                    <POICard :id="region.poi.id" :label="region.poi.titleTranslation.german"
                        :type="poiTypeToString(region.poi.poiType)" :countryId="region.poi.countryId"
                        :wikiDataId="region.poi.wikiDataId" :imageUrl="getPreviewImage(region.poi)"
                        v-for="region in subregions" :key="region.poi.poiId" />
                </Column>

                <Column style="height:90vh; overflow:auto;display:block;" class="imageRow overflow-scroll">
                    <!-- <div> </div> -->
                    <POICard :id="region.poi.id" :label="region.poi.titleTranslation.german"
                        :type="poiTypeToString(region.poi.poiType)" :countryId="region.poi.countryId"
                        :wikiDataId="region.poi.wikiDataId" :imageUrl="getPreviewImage(region.poi)"
                        v-for="region in countries" :key="region.poi.poiId" class="dark:backdrop-blur"/>
                </Column>

                <Column style="height:90vh; overflow:auto;display:block;" class="imageRow overflow-scroll">
                    <!-- <div> </div> -->
                    <POICard :id="region.poi.id" :label="region.poi.titleTranslation.german"
                        :type="poiTypeToString(region.poi.poiType)" :countryId="region.poi.countryId"
                        :wikiDataId="region.poi.wikiDataId" :imageUrl="getPreviewImage(region.poi)"
                        v-for="region in states" :key="region.poi.poiId" />
                </Column>
            </Row>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import POICard from "../components/poi/POICard.vue";
import { getRegions, getSubregions, getCountries, getStates } from "../network_service.ts";

const router = useRoute();

const regions = ref(null);
const subregions = ref(null);
const countries = ref(null);
const states = ref(null);

async function initSetup() {
    try {
        regions.value = await getRegions();
        subregions.value = await getSubregions();
        countries.value = await getCountries();
        states.value = await getStates();
    } catch (error) {
        console.error(error);
    }
}

initSetup();

const getPreviewImage = (poi) => {
    if (poi.image == undefined)
        return "https://t4.ftcdn.net/jpg/04/70/29/97/360_F_470299797_UD0eoVMMSUbHCcNJCdv2t8B2g1GVqYgs.jpg";

    return poi.image.previewImageUrl;
};

const poiTypeToString = (poiType) => {
    if (poiType == 1) {
        return "City";
    } else if (poiType == 2) {
        return "Country";
    } else if (poiType == 3) {
        return "State";
    }
};
</script>